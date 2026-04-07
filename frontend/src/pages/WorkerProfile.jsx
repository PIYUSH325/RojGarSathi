import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import WorkerSidebar from '../components/WorkerSidebar';
import SkillTagsInput from '../components/SkillTagsInput';
import { useAuth } from '../context/AuthContext';
import { getPhotoUrl } from '../utils/photoUrl';
import './WorkerProfile.css';

const WorkerProfile = () => {
  const { t } = useTranslation();
  const {
    user,
    profilePhoto,
    resume,
    apiBase,
    updateProfilePhoto,
    updateResume,
    updateProfile,
    fetchProfile,
    isLoading,
    logout
  } = useAuth();

  // Hydrate once from server so stale local storage data does not overwrite fields.

  // ================= STATE =================
  const [photoFile, setPhotoFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [resumePath, setResumePath] = useState('');
  const [isProfileHydrated, setIsProfileHydrated] = useState(false);

  const saveTimeoutRef = React.useRef(null);

  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [skills, setSkills] = useState([]);
  const [salaryRange, setSalaryRange] = useState('');
  const [experience, setExperience] = useState([]);

  useEffect(() => {
    let active = true;

    const hydrateProfile = async () => {
      if (!user?.id) return;
      try {
        await fetchProfile();
      } catch (error) {
        console.error('Profile hydration failed:', error);
      } finally {
        if (active) setIsProfileHydrated(true);
      }
    };

    hydrateProfile();

    return () => {
      active = false;
    };
  }, [fetchProfile, user?.id]);

  // ================= INIT =================
  useEffect(() => {
    setPhotoPreview(getPhotoUrl(profilePhoto, apiBase));

    setResumeName(resume ? resume.split('/').pop() : t('workerProfile.noResumeUploaded'));

    setResumePath(getPhotoUrl(resume, apiBase));

    setCity(typeof user?.city === 'string' ? user.city : '');
    setPincode(typeof user?.pincode === 'string' ? user.pincode : '');
    setSkills(Array.isArray(user?.skills) ? user.skills : []);
    setExperience(Array.isArray(user?.experience) ? user.experience : []);
    setSalaryRange(typeof user?.salaryRange === 'string' ? user.salaryRange : '');
  }, [user, profilePhoto, resume, apiBase, t]);

  // Auto-save city, pincode, skills, salaryRange, experience
  useEffect(() => {
    if (!user?.id || !isProfileHydrated) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateProfile({
          city,
          pincode,
          salaryRange,
          skills,
          experience
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 1000); // 1s debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [city, pincode, skills, salaryRange, experience, updateProfile, user?.id, isProfileHydrated]);

  // ================= HANDLERS =================
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
    }
  };

  const handlePhotoUpload = async () => {
    if (photoFile) await updateProfilePhoto(photoFile);
  };

  const handleResumeUpload = async () => {
    if (resumeFile) await updateResume(resumeFile);
  };

  const handleProfileSave = async () => {
    await updateProfile({
      city,
      pincode,
      salaryRange,
      skills,
      experience
    });
  };

  // ================= PROFILE COMPLETION =================
  const profileCompletion = () => {
    let score = 0;
    if (photoPreview) score += 20;
    if (resumePath) score += 20;
    if (city) score += 20;
    if (pincode) score += 20;
    if (skills) score += 20;
    if (salaryRange) score += 20;
    return Math.min(score, 100);
  };

  if (isLoading) {
    return <div className="text-center py-5">{t('admin.common.loading')}</div>;
  }

  const completion = profileCompletion();

  return (
    <div className="worker-profile-page min-vh-100 py-4">
      <div className="worker-profile-bg-shape worker-profile-bg-shape-one" />
      <div className="worker-profile-bg-shape worker-profile-bg-shape-two" />

      <div className="container-fluid">
      <div className="row g-4">

        {/* ================= SIDEBAR ================= */}
        <div className="col-lg-3 d-none d-lg-block">
          <WorkerSidebar userId={user?.id} logout={logout} />
        </div>

        {/* ================= MAIN ================= */}
        <div className="col-lg-9">
          <section className="worker-profile-hero mb-4">
            <div className="worker-profile-hero-copy">
              <p className="worker-profile-kicker mb-2">{t('workerProfile.kicker')}</p>
              <h2 className="worker-profile-title mb-2">{t('workerProfile.title')}</h2>
              <p className="worker-profile-subtitle mb-0">
                {t('workerProfile.subtitle')}
              </p>
            </div>

            <div className="worker-profile-completion-chip">
              <span className="completion-label">{t('workerProfile.profileCompletion')}</span>
              <strong>{completion}%</strong>
            </div>
          </section>

          <div className="row g-4 align-items-stretch mb-4">
            <div className="col-xl-7">
              <div className="worker-card worker-card-glass text-center text-md-start h-100">
                <div className="d-md-flex align-items-center gap-4">
                  <img
                    src={photoPreview}
                    alt={t('header.profile')}
                    className="worker-avatar"
                  />

                  <div className="flex-grow-1 mt-3 mt-md-0">
    <h5 className="worker-name mb-1">{typeof user?.name === 'string' ? user.name : t('admin.common.na')}</h5>
    <p className="worker-id mb-3">{t('workerProfile.workerId')} {typeof user?.id === 'string' ? user.id : t('admin.common.na')}</p>

                    <div className="worker-progress-shell">
                      <div className="progress worker-progress-bar">
                        <div
                          className="progress-bar worker-progress-fill"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                      <small className="worker-progress-text">{t('workerProfile.profileCompleteText', { completion })}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-5">
              <div className="worker-card worker-card-accent h-100">
                <h5 className="fw-bold mb-3">{t('workerProfile.quickChecklist')}</h5>
                <ul className="worker-checklist mb-0">
                  <li className={photoPreview ? 'done' : ''}>{t('workerProfile.checklist.photo')}</li>
                  <li className={resumePath ? 'done' : ''}>{t('workerProfile.checklist.resume')}</li>
                  <li className={city && pincode ? 'done' : ''}>{t('workerProfile.checklist.location')}</li>
                  <li className={skills ? 'done' : ''}>{t('workerProfile.checklist.skills')}</li>
                  <li className={salaryRange ? 'done' : ''}>{t('workerProfile.checklist.salary')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ================= PHOTO ================= */}
          <div className="worker-card mb-4">
            <h5 className="fw-bold mb-3">{t('workerProfile.profilePhoto')}</h5>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="form-control worker-input mb-3"
            />

            <button
              onClick={handlePhotoUpload}
              className="btn worker-btn-primary rounded-pill px-4"
            >
              {t('workerProfile.uploadPhoto')}
            </button>
          </div>

          {/* ================= RESUME ================= */}
          <div className="worker-card mb-4">
            <h5 className="fw-bold mb-3">{t('workerProfile.resume')}</h5>

            <div className="worker-file-chip p-3 rounded d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span className="text-truncate">{resumeName}</span>

              {resumePath && (
                <a href={resumePath} className="btn btn-sm worker-btn-outline">
                  {t('workerProfile.download')}
                </a>
              )}
            </div>

            <input
              type="file"
              onChange={handleResumeChange}
              className="form-control worker-input mt-3"
            />

            <button
              onClick={handleResumeUpload}
              className="btn worker-btn-primary mt-3 rounded-pill px-4"
            >
              {t('workerProfile.uploadResume')}
            </button>
          </div>

          {/* ================= PERSONAL INFO ================= */}
          <div className="worker-card mb-4">
            <h5 className="fw-bold mb-3">{t('workerProfile.personalInformation')}</h5>

            <div className="row g-3">
              <div className="col-md-6">
                <input
                  className="form-control worker-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('workerProfile.city')}
                />
              </div>

              <div className="col-md-6">
                <input
                  className="form-control worker-input"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder={t('workerProfile.pincode')}
                />
              </div>
            </div>

            <div className="row g-3 mt-3">
              <div className="col-12">
                <label className="form-label fw-bold">{t('workerProfile.expectedSalaryRange')}</label>
                <select
                  className="form-select worker-input"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                >
                  <option value="">{t('workerProfile.selectSalaryRange')}</option>
                  <option value="upto20k">{t('workerProfile.salaryRanges.upto20k')}</option>
                  <option value="20k-40k">{t('workerProfile.salaryRanges.k20to40')}</option>
                  <option value="40k-60k">{t('workerProfile.salaryRanges.k40to60')}</option>
                  <option value="60k-80k">{t('workerProfile.salaryRanges.k60to80')}</option>
                  <option value="above80k">{t('workerProfile.salaryRanges.above80k')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* ================= SKILLS ================= */}
          <div className="worker-card mb-4">
            <h5 className="fw-bold mb-3">{t('workerProfile.skills')}</h5>

            <SkillTagsInput value={skills} onChange={setSkills} />
          </div>

          {/* ================= EXPERIENCE ================= */}
          <div className="worker-card mb-4">
            <h5 className="fw-bold mb-3">{t('workerProfile.experience')}</h5>

            <button
              className="btn worker-btn-outline mb-3"
              onClick={() =>
                setExperience([...experience, { company: '', role: '' }])
              }
            >
              + {t('workerProfile.addExperience')}
            </button>

            {experience.map((exp, index) => (
              <div className="row mb-2" key={index}>
                <div className="col-md-5">
                  <input
                    className="form-control worker-input"
                    placeholder={t('workerProfile.company')}
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...experience];
                      updated[index].company = e.target.value;
                      setExperience(updated);
                    }}
                  />
                </div>

                <div className="col-md-5">
                  <input
                    className="form-control worker-input"
                    placeholder={t('workerProfile.role')}
                    value={exp.role}
                    onChange={(e) => {
                      const updated = [...experience];
                      updated[index].role = e.target.value;
                      setExperience(updated);
                    }}
                  />
                </div>

                <div className="col-md-2">
                  <button
                    className="btn worker-btn-danger w-100"
                    onClick={() =>
                      setExperience(experience.filter((_, i) => i !== index))
                    }
                  >
                    {t('workerProfile.remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ================= SAVE ================= */}
          <div className="text-end">
            <button
              onClick={handleProfileSave}
              className="btn btn-lg rounded-pill worker-btn-primary px-5"
            >
              {t('workerProfile.saveProfile')}
            </button>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
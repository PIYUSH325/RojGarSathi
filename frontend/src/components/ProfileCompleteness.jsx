import React from 'react';
import { useTranslation } from 'react-i18next';

const ProfileCompleteness = ({ user }) => {
  const { t } = useTranslation();

  const calculateCompleteness = () => {
    const fields = [
      user.name,
      user.email,
      user.role,
      user.city,
      user.pincode,
      user.skills?.length > 0,
      user.profilePhoto,
      user.resume,
      user.bio,
      user.experienceYears > 0,
      user.education?.length > 0,
      user.hourlyRate > 0,
      user.portfolioLinks?.length > 0
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completeness = calculateCompleteness();
  const isComplete = completeness >= 80;

  return (
    <div className="mb-4">
      <h5>{t('profileCompleteness.title')}</h5>
      <div className="progress mb-2" style={{ height: '20px' }}>
        <div 
          className={`progress-bar ${isComplete ? 'bg-success' : 'bg-warning'}`}
          role="progressbar"
          style={{ width: `${completeness}%` }}
          aria-valuenow={completeness}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {completeness}%
        </div>
      </div>
      <small className={`text-${isComplete ? 'success' : 'warning'} fw-bold`}>
        {isComplete
          ? t('profileCompleteness.complete')
          : t('profileCompleteness.incomplete', { remaining: 100 - completeness })}
      </small>
    </div>
  );
};

export default ProfileCompleteness;


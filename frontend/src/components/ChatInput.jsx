import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Mic, ImageIcon, FileText, Sparkles, Video, Music, Loader2 } from 'lucide-react';
import './ChatInput.css';
import { useTranslation } from 'react-i18next';

const ChatInput = ({
  onSendMessage,
  onTyping,
  isLoading,
  conversationId,
  apiBase = '',
  senderId = '',
  receiverId = '',
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [previewFiles, setPreviewFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previewFilesRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const lastSubmitRef = useRef({ key: '', at: 0 });
  const MAX_FILE_SIZE = 1024 * 1024 * 1024;
  const ALLOWED_FILE_INPUT = 'image/*,video/*,audio/*,application/pdf';

  useEffect(() => {
    previewFilesRef.current = previewFiles;
  }, [previewFiles]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      previewFilesRef.current.forEach((file) => {
        if (file.preview && file.preview.startsWith('blob:')) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [message]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    if (onTyping) {
      onTyping(conversationId, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (onTyping) {
          onTyping(conversationId, false);
        }
      }, 2000);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const detectFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf') return 'pdf';
    return null;
  };

  const sanitizeFileName = (name = '') => name.replace(/[^a-zA-Z0-9._-]/g, '-');

  const formatRecordingTime = (seconds) => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const remaining = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${remaining}`;
  };

  const getRecordingExtension = (mimeType = '') => {
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
    if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
    return 'webm';
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
      alert(t('chatInput.audioNotSupported'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
      ];

      const selectedMimeType = preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const blobType = recorder.mimeType || selectedMimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: blobType });

        if (audioBlob.size === 0) {
          setIsRecording(false);
          setRecordingSeconds(0);
          return;
        }

        if (audioBlob.size > MAX_FILE_SIZE) {
          alert(t('chatInput.recordedAudioTooLarge'));
          setIsRecording(false);
          setRecordingSeconds(0);
          return;
        }

        const extension = getRecordingExtension(blobType);
        const fileName = `voice-note-${Date.now()}.${extension}`;
        const audioFile = new File([audioBlob], fileName, {
          type: blobType,
          lastModified: Date.now(),
        });

        setPreviewFiles((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            file: audioFile,
            preview: '',
            type: 'audio',
            name: fileName,
            extension: extension.toUpperCase(),
            sizeLabel: formatFileSize(audioFile.size),
          },
        ]);

        setIsRecording(false);
        setRecordingSeconds(0);

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      alert(t('chatInput.microphoneRequired'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoicePillClick = async () => {
    if (disabled || isUploading) {
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    await startRecording();
  };

  const compressImageFile = (file) =>
    new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const maxDimension = 1920;
        let { width, height } = image;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          file.type,
          0.82
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      image.src = objectUrl;
    });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    const nextItems = [];

    for (const originalFile of files) {
      const fileType = detectFileType(originalFile);
      if (!fileType) {
        alert(t('chatInput.invalidFileType'));
        continue;
      }

      let processedFile = originalFile;
      if (fileType === 'image') {
        processedFile = await compressImageFile(originalFile);
      }

      if (processedFile.size > MAX_FILE_SIZE) {
        alert(t('chatInput.fileTooLarge', { name: processedFile.name }));
        continue;
      }

      const extension = processedFile.name.split('.').pop()?.toUpperCase() || fileType.toUpperCase();
      const preview = fileType === 'image' || fileType === 'video'
        ? URL.createObjectURL(processedFile)
        : '';

      nextItems.push({
        id: `${Date.now()}-${Math.random()}`,
        file: processedFile,
        preview,
        type: fileType,
        name: sanitizeFileName(processedFile.name),
        extension,
        sizeLabel: formatFileSize(processedFile.size),
      });
    }

    if (nextItems.length > 0) {
      setPreviewFiles((prev) => [...prev, ...nextItems]);
    }

    e.target.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    if (!message.trim() && previewFiles.length === 0) {
      return;
    }

    const submitKey = JSON.stringify({
      text: message.trim(),
      files: previewFiles.map((pf) => `${pf.name}:${pf.file?.size || 0}:${pf.type}`),
    });
    const now = Date.now();
    if (lastSubmitRef.current.key === submitKey && now - lastSubmitRef.current.at < 1500) {
      return;
    }
    lastSubmitRef.current = { key: submitKey, at: now };

    isSubmittingRef.current = true;

    try {
      // Upload files first if any exist
      let uploadedAttachments = [];
      if (previewFiles.length > 0) {
        try {
          setIsUploading(true);
          console.log('[ChatInput] Uploading attachments:', previewFiles.map((pf) => ({
            name: pf.name,
            type: pf.type,
            size: pf.file?.size,
          })));
          uploadedAttachments = await Promise.all(
            previewFiles.map((pf) => uploadFile(pf))
          );
          
          // Filter out any failed uploads
          uploadedAttachments = uploadedAttachments.filter(att => att !== null);
          console.log('[ChatInput] Upload completed. Success count:', uploadedAttachments.length, 'Expected:', previewFiles.length);

          if (previewFiles.length > 0 && uploadedAttachments.length === 0) {
            alert(t('chatInput.attachmentUploadFailed'));
            return;
          }
        } catch (error) {
          console.error('Error uploading files:', error);
          alert(t('chatInput.partialUploadFailed'));
          return;
        } finally {
          setIsUploading(false);
          setUploadProgress({});
        }
      }

      const primaryType = uploadedAttachments[0]?.type || 'text';

      // Send message with uploaded file paths
      await onSendMessage({
        message: message.trim(),
        content: message.trim(),
        type: primaryType,
        attachments: uploadedAttachments,
      });

      setMessage('');
      setPreviewFiles([]);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      if (onTyping) {
        onTyping(conversationId, false);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const uploadFile = (previewFile) =>
    new Promise((resolve) => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        resolve(null);
        return;
      }

      const buildFormData = (fileFieldName = 'file') => {
        const formData = new FormData();
        formData.append(fileFieldName, previewFile.file);
        formData.append('conversationId', conversationId || '');
        formData.append('messageType', previewFile.type);
        formData.append('senderId', senderId);
        formData.append('receiverId', receiverId);
        return formData;
      };

      const apiOrigin = apiBase
        ? apiBase.replace(/\/api\/v1\/?$/, '')
        : window.location.origin;

      const alternateOrigin = apiOrigin.includes('localhost:5000')
        ? apiOrigin.replace('localhost:5000', 'localhost:5001')
        : null;

      const endpointCandidates = [
        { url: `${apiOrigin}/api/messages/upload`, field: 'file' },
        { url: `${apiOrigin}/api/v1/chat/upload`, field: 'file' },
        { url: `${apiOrigin}/api/v1/chat/upload-attachment`, field: 'file' },
        { url: `${apiOrigin}/api/v1/chat/upload-attachment`, field: 'attachment' },
      ];

      if (alternateOrigin) {
        endpointCandidates.push(
          { url: `${alternateOrigin}/api/messages/upload`, field: 'file' },
          { url: `${alternateOrigin}/api/v1/chat/upload`, field: 'file' },
          { url: `${alternateOrigin}/api/v1/chat/upload-attachment`, field: 'file' },
          { url: `${alternateOrigin}/api/v1/chat/upload-attachment`, field: 'attachment' }
        );
      }

      const normalizeUploadResponse = (data) => {
        const fileUrl = data.fileUrl || data.filePath || data.url || '';
        if (!fileUrl) return null;

        return {
          url: fileUrl,
          type: data.type || data.fileType || previewFile.type,
          name: data.fileName || previewFile.name,
          size: data.fileSize || previewFile.file?.size || 0,
        };
      };

      const tryFallbacks = async (startIndex = 1) => {
        for (let i = startIndex; i < endpointCandidates.length; i++) {
          const candidate = endpointCandidates[i];
          try {
            console.log('[ChatInput] Trying fallback upload URL:', candidate.url, 'field:', candidate.field);
            const response = await fetch(candidate.url, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: buildFormData(candidate.field),
            });

            const responseData = await response.json().catch(() => ({}));
            if (response.ok && responseData?.success) {
              const normalized = normalizeUploadResponse(responseData);
              if (normalized) {
                console.log('[ChatInput] Fallback upload success:', candidate.url, responseData);
                setUploadProgress((prev) => ({ ...prev, [previewFile.id]: 100 }));
                resolve(normalized);
                return;
              }
            }

            console.error('[ChatInput] Fallback upload failed:', candidate.url, response.status, responseData);
          } catch (error) {
            console.error('[ChatInput] Fallback upload error:', candidate.url, error);
          }
        }

        resolve(null);
      };

      const primaryUploadUrl = endpointCandidates[0].url;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', primaryUploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      console.log('[ChatInput] Primary upload URL:', primaryUploadUrl);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress((prev) => ({ ...prev, [previewFile.id]: percent }));
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              const normalized = normalizeUploadResponse(data);
              if (normalized) {
                console.log('[ChatInput] Primary upload success:', data);
                setUploadProgress((prev) => ({ ...prev, [previewFile.id]: 100 }));
                resolve(normalized);
                return;
              }
            }
          } catch (error) {
            console.error('Primary upload parse error:', error);
          }
        }

        await tryFallbacks(1);
      };

      xhr.onerror = () => {
        void tryFallbacks(1);
      };

      xhr.send(buildFormData('file'));
    });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const removePreviewFile = (index) => {
    setPreviewFiles((prev) => {
      const fileToDelete = prev[index];
      if (fileToDelete?.preview && fileToDelete.preview.startsWith('blob:')) {
        URL.revokeObjectURL(fileToDelete.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className={`chat-input-container ${isFocused ? 'focused' : ''}`}>
      <div className="chat-input-backdrop"></div>

      {previewFiles.length > 0 && (
        <div className="preview-container">
          {previewFiles.map((pf, idx) => (
            <div
              key={`${pf.name}-${idx}`}
              className={`preview-item ${pf.type === 'image' ? 'is-image' : 'is-file'} file-type-${pf.type}`}
            >
              {pf.type === 'image' ? (
                <div className="preview-image-card">
                  <div className="preview-image-wrapper">
                    <img src={pf.preview} alt="Preview" className="preview-image" />
                    <div className="preview-image-overlay">
                      <span className="preview-chip">
                        <ImageIcon size={14} />
                        {t('chatInput.image')}
                      </span>
                    </div>
                  </div>
                  <div className="preview-meta">
                    <p className="file-name">{pf.name}</p>
                    <p className="file-size">{pf.extension} • {pf.sizeLabel}</p>
                  </div>
                  <button
                    className="remove-preview"
                    onClick={() => removePreviewFile(idx)}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : pf.type === 'video' ? (
                <div className="preview-video-card">
                  <div className="preview-video-wrapper">
                    <video src={pf.preview} className="video-thumbnail" controls preload="metadata" />
                    <div className="video-overlay">
                      <span className="video-chip">
                        <Video size={18} />
                      </span>
                    </div>
                  </div>
                  <div className="preview-meta">
                    <p className="file-name">{pf.name}</p>
                    <p className="file-size">{pf.extension} • {pf.sizeLabel}</p>
                  </div>
                  <button
                    className="remove-preview"
                    onClick={() => removePreviewFile(idx)}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="preview-file-card">
                  <div className="preview-file-icon">
                    {pf.type === 'pdf' ? (
                      <FileText size={18} color="#dc2626" />
                    ) : pf.type === 'audio' ? (
                      <Music size={18} color="#0891b2" />
                    ) : (
                      <FileText size={18} color="#6366f1" />
                    )}
                  </div>
                  <div className="file-info">
                    <p className="file-name">{pf.name}</p>
                    <p className="file-size">
                      {pf.extension} • {pf.sizeLabel}
                    </p>
                  </div>
                  <button
                    className="remove-preview"
                    onClick={() => removePreviewFile(idx)}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {typeof uploadProgress[pf.id] === 'number' && (
                <div className="upload-progress-wrap">
                  <div className="upload-progress-bar" style={{ width: `${uploadProgress[pf.id]}%` }}></div>
                  <span className="upload-progress-text">{uploadProgress[pf.id]}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form className="input-form" onSubmit={handleSendMessage}>
        <div className="composer-shell">
          <div className="composer-utility composer-voice">
            <button
              type="button"
              className={`voice-pill ${isRecording ? 'recording' : ''}`}
              onClick={handleVoicePillClick}
              disabled={disabled || isUploading}
              title={isRecording ? t('chatInput.stopRecording') : t('chatInput.startRecording')}
            >
              <Mic size={15} />
              <div className="voice-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="voice-status">{isRecording ? `${t('chatInput.rec')} ${formatRecordingTime(recordingSeconds)}` : t('chatInput.voice')}</span>
            </button>
          </div>

          <div className="input-wrapper">
            <button
              type="button"
              className="attachment-btn"
              onClick={() => fileInputRef.current?.click()}
              title={t('chatInput.attachFiles')}
            >
              <Paperclip size={18} />
            </button>

            <input
              type="file"
              id="chat-attachment-input"
              name="chatAttachment"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              hidden
              accept={ALLOWED_FILE_INPUT}
            />

            <div className="message-field">
              <div className="message-field-topline">
                <Sparkles size={13} />
                <span>{t('chatInput.composeReply')}</span>
              </div>

              <textarea
                ref={textareaRef}
                id="chat-message-input"
                name="chatMessage"
                className="message-input"
                placeholder={t('chatInput.placeholder')}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading || isUploading || disabled}
                rows="1"
              />
            </div>

            <button
              type="submit"
              className="send-btn"
              disabled={isLoading || isUploading || disabled || (!message.trim() && previewFiles.length === 0)}
              title={t('chatInput.sendMessage')}
            >
              <span className="send-btn-ripple"></span>
              {isUploading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
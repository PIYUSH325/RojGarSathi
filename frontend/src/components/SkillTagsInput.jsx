import React from 'react';
import TagsInput from 'react-tagsinput';

const SkillTagsInput = ({ skills, onChange, placeholder = "Add skills..." }) => {
  const handleChange = (newTags) => {
    onChange(newTags);
  };

  return (
    <TagsInput 
      value={skills || []}
      onChange={handleChange}
      inputProps={{
        className: 'form-control rounded-pill px-3',
        placeholder
      }}
      className="react-tagsinput"
      inputClassName="react-tagsinput-input form-control"
      tagClassName="badge bg-primary me-1 mb-1"
      renderTag={({ tag, props }) => (
        <span {...props} className="badge bg-primary me-1 mb-1">
          {tag}
        </span>
      )}
    />
  );
};

export default SkillTagsInput;


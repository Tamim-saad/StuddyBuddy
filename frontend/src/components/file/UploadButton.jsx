import React from 'react';
import PropTypes from 'prop-types';

export const UploadButton = ({ onUpload, disabled }) => {
  return (
    <label className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors disabled:opacity-50">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
      Upload
      <input
        type="file"
        className="hidden"
        onChange={(e) => onUpload(e.target.files[0])}
        disabled={disabled}
      />
    </label>
  );
};

UploadButton.propTypes = {
  onUpload: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};
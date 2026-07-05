import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * OTP Input Component
 * Handles 6-digit OTP code entry with auto-focus and validation
 */
const OTPInput = ({ length = 6, onComplete, loading, error }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    // Call onComplete when all digits are filled
    if (otp.every(digit => digit !== '')) {
      onComplete(otp.join(''));
    }
  }, [otp, onComplete]);

  const handleChange = (value, index) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (otp[index]) {
        // Clear current digit
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous input and clear
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Handle left/right arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    
    // Only allow digits
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, idx) => {
      if (idx < length) {
        newOtp[idx] = char;
      }
    });

    setOtp(newOtp);

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex gap-2 justify-center mb-4">
        {otp.map((digit, index) => (
          <motion.input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={loading}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all duration-200 
              ${digit ? 'border-primary bg-primary/10' : 'border-text/20'}
              ${error ? 'border-red-500 bg-red-500/10' : ''}
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              text-text bg-background`}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default OTPInput;

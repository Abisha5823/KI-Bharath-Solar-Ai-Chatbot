import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaSolarPanel } from 'react-icons/fa';

const FloatingButton = ({ onClick }) => {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition z-40"
    >
      <FaSolarPanel size={28} />
    </motion.button>
  );
};

export default FloatingButton;
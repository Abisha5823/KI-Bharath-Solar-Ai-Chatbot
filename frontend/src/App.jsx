import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBot from './components/ChatBot';
import FloatingButton from './components/FloatingButton';
import { FaSolarPanel, FaBolt, FaBatteryFull } from 'react-icons/fa';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10" />
        <div className="container mx-auto px-4 py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4">
              KI BHARATH
              <span className="text-orange-500"> SOLAR</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">Trusted Solar Solutions in Tamil Nadu Since 8+ Years</p>
            
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="flex items-center gap-2">
                <FaSolarPanel className="text-orange-500 text-2xl" />
                <span>500+ Installations</span>
              </div>
              <div className="flex items-center gap-2">
                <FaBolt className="text-yellow-500 text-2xl" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <FaBatteryFull className="text-green-500 text-2xl" />
                <span>Premium Brands</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition-all transform hover:scale-105"
            >
              💬 Chat with Solar Expert
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Services Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      <FloatingButton onClick={() => setIsChatOpen(true)} />
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

const services = [
  { icon: "🏠", title: "Residential Solar", description: "Save up to 90% on electricity bills with rooftop solar" },
  { icon: "🏭", title: "Commercial Solar", description: "Reduce operational costs with industrial solar solutions" },
  { icon: "🔋", title: "Battery Backup", description: "Lithium-ion and tubular batteries for 24/7 power" },
  { icon: "📊", title: "Free Consultation", description: "Get expert advice and site inspection" },
  { icon: "💰", title: "Subsidy Assistance", description: "Complete support for government solar subsidies" },
  { icon: "🔧", title: "AMC Services", description: "Annual maintenance contracts for long-term performance" }
];

export default App;
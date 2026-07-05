import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";


export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);


  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);
  
  try {
    const response = await fetch(`https://formspree.io/f/${import.meta.env.VITE_FORMSPREE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', message: '' });
      }, 3000);
    } else {
      throw new Error('Form submission failed');
    }
  } catch (err) {
    console.error('Error:', err);
    setError('Something went wrong. Please try again.');
    setIsSubmitting(false);
  }
};



  const contactMethods = [
    {
      title: "Email",
      value: "hello@Learncurve.com",
      icon: "✉️",
      description: "Send us an email anytime"
    },
    {
      title: "Response Time",
      value: "24-48 hours",
      icon: "⏱️",
      description: "We'll get back to you soon in a year"
    },
    {
      title: "Support",
      value: "Community driven",
      icon: "🤝",
      description: "Join our learning community"
    }
  ];


  return (
    <div className="my-10 text-text px-6 py-16 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold text-primary mb-6"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.3 }}
          >
            Get In Touch
          </motion.h1>
          <motion.p 
            className="text-text/70 mb-8 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            Have questions about Learncurve? Want to collaborate or provide feedback? 
            We'd love to hear from you!
          </motion.p>
        </motion.div>


        <div className="grid lg:grid-cols-5 gap-12 items-start">
          
          <div className="lg:col-span-2 space-y-6">
            {contactMethods.map((method, idx) => (
              <motion.div
                key={method.title}
                className="p-6 rounded-xl bg-background shadow-lg border border-primary/20 hover:border-primary/40 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }} 
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: '0 8px 25px rgba(var(--color-primary-rgb), 0.1)',
                  transition: { duration: 0.15 } 
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{method.icon}</span>
                  <h3 className="text-lg font-semibold text-primary">{method.title}</h3>
                </div>
                <p className="text-text font-medium mb-2">{method.value}</p>
                <p className="text-text/60 text-sm">{method.description}</p>
              </motion.div>
            ))}
          </div>


          <motion.div 
            className="lg:col-span-3 p-8 rounded-xl bg-background shadow-xl border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-primary mb-6">
              Send us a Message
            </h2>


            {isSubmitted ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-primary mb-2">Message Sent!</h3>
                <p className="text-text/70">Thanks for reaching out. We'll get back to you soon!</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-medium text-text">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-primary/30 bg-background
                                focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                                transition-all duration-150 text-text placeholder:text-text/50"
                      placeholder="Your name"
                      required
                    />
                  </div>


                  <div>
                    <label className="block mb-2 font-medium text-text">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-primary/30 bg-background
                                focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                                transition-all duration-150 text-text placeholder:text-text/50"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>


                <div>
                  <label className="block mb-2 font-medium text-text">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    className="w-full px-4 py-3 rounded-lg border border-primary/30 bg-background
                              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                              transition-all duration-150 resize-none text-text placeholder:text-text/50"
                    placeholder="Tell us about your question, feedback, or how we can help..."
                    required
                  ></textarea>
                </div>


                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-lg font-semibold bg-primary text-text 
                            hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-150 flex items-center justify-center"
                  style={{
                    boxShadow: '0 4px 15px rgba(var(--color-primary-rgb), 0.3)'
                  }}
                  whileHover={!isSubmitting ? { 
                    scale: 1.02,
                    boxShadow: '0 6px 20px rgba(var(--color-primary-rgb), 0.4)',
                    transition: { duration: 0.15 }
                  } : {}}
                  whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background mr-3"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

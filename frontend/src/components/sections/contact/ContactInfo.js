import React from 'react';
import { FiMail, FiMapPin, FiClock } from 'react-icons/fi';
import ScrollAnimation from '../../ScrollAnimation';
import './ContactInfo.css';

const ContactInfo = () => {
  // Only real, working channels — no placeholder phone numbers or addresses.
  const contactMethods = [
    {
      icon: <FiMail />,
      title: 'Message us',
      info: 'Use the form below — it reaches the team directly',
      link: '#contact-form'
    },
    {
      icon: <FiClock />,
      title: 'Response time',
      info: 'Usually within 2 working days',
      link: '#contact-form'
    },
    {
      icon: <FiMapPin />,
      title: 'Where we work',
      info: 'Remote team · Lahore, Pakistan',
      link: '#contact-form'
    }
  ];

  return (
    <section className="contact-info">
      <div className="container">
        <div className="contact-info-grid">
          {contactMethods.map((method, index) => (
            <ScrollAnimation
              key={index}
              delay={index * 0.1}
              className="contact-info-card-wrapper"
            >
              <a
                href={method.link}
                className="contact-info-card"
              >
              <div className="contact-info-icon">{method.icon}</div>
              <h3 className="contact-info-title">{method.title}</h3>
              <p className="contact-info-text">{method.info}</p>
              </a>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactInfo;


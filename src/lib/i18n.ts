import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
type Language = 'en' | 'mr' | 'hi';
type Translations = {
  [key: string]: {
    [key: string]: string;
  };
};
interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}
const translations: Translations = {
  en: {
    // HomePage
    appName: 'Mess Connect',
    appSlogan: 'Your daily meal management, simplified.',
    studentLoginTitle: 'Student Login',
    managerLoginTitle: 'Manager Login',
    adminLoginTitle: 'Admin Login',
    loginDescription: 'Enter your credentials to access your dashboard.',
    emailLabel: 'Email',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    signInButton: 'Sign In',
    signingInButton: 'Signing In...',
    noAccount: "Don't have an account?",
    registerHere: 'Register here',
    guestPaymentLink: 'Pay as a Guest',
    // RegisterPage
    registerTitle: 'Student Registration',
    registerDescription: 'Create your account to join the mess.',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'John Doe',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '9876543210',
    registerButton: 'Register',
    registeringButton: 'Registering...',
    haveAccount: 'Already have an account?',
    loginHere: 'Login here',
  },
  mr: {
    // HomePage
    appName: 'मेस कनेक्ट',
    appSlogan: 'तुमचे दैनंदिन जेवण व्यवस्था��न, सोपे केले.',
    studentLoginTitle: 'विद्यार्थी लॉगिन',
    managerLoginTitle: 'व्यवस्थापक लॉगिन',
    adminLoginTitle: 'प्रशासक लॉगिन',
    loginDescription: 'तुमच्या डॅशबोर्डवर प्रवेश करण्यासाठी तुमचे क्रेडेन्शियल्स प्रविष्ट करा.',
    emailLabel: 'ईमेल',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    signInButton: 'साइन इन करा',
    signingInButton: 'साइन इन करत आहे...',
    noAccount: 'खा��े नाही?',
    registerHere: 'येथे नोंदणी करा',
    guestPaymentLink: 'अतिथी म्हणून पैसे द्या',
    // RegisterPage
    registerTitle: 'विद्यार्थी नोंदणी',
    registerDescription: 'मेसमध्ये ��ामील होण्यासाठी तुमचे खाते तयार करा.',
    fullNameLabel: 'पूर्ण नाव',
    fullNamePlaceholder: 'जॉन ��ो',
    phoneLabel: 'फोन नंबर',
    phonePlaceholder: '९८७६५४३��१०',
    registerButton: 'नोंदणी करा',
    registeringButton: 'नोंदणी करत आहे...',
    haveAccount: 'आधीपासूनच खाते आहे?',
    loginHere: 'येथे लॉगिन करा',
  },
  hi: {
    // HomePage
    appName: 'मेस कनेक्ट',
    appSlogan: 'आपका दैनिक भोजन प्रबंधन, सरलीकृत।',
    studentLoginTitle: 'छात्र लॉगिन',
    managerLoginTitle: 'प्रबंधक लॉगिन',
    adminLoginTitle: 'प्रशासक लॉगिन',
    loginDescription: 'अपने डैशबोर्ड तक प���ुंचने के लिए अपनी क्रेडेंशियल दर्ज करें।',
    emailLabel: 'ईमेल',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    signInButton: 'साइन इन करें',
    signingInButton: 'साइन इन हो रहा ह��...',
    noAccount: 'खाता नहीं है?',
    registerHere: 'यहां पंजीक���ण करें',
    guestPaymentLink: 'अतिथि के रूप में भुगतान करें',
    // RegisterPage
    registerTitle: 'छात्र पंजीकरण',
    registerDescription: 'मेस में शामिल होने के लिए अपना खाता ब��ाएं।',
    fullNameLabel: 'पूरा नाम',
    fullNamePlaceholder: 'जॉन डो',
    phoneLabel: 'फ़ोन नंबर',
    phonePlaceholder: '९८७६५४३२१०',
    registerButton: 'पंजीकरण करें',
    registeringButton: 'पंजीकरण हो रहा है...',
    haveAccount: 'पहले से ही एक खाता है?',
    loginHere: 'यहां लॉगिन करें',
  },
};
const I18nContext = createContext<I18nContextType | undefined>(undefined);
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language') as Language;
    return savedLang || 'en';
  });
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };
  const t = useCallback((key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Download, Share2, Eye, Edit3, Sparkles, User, Briefcase, GraduationCap, Code, FolderOpen, FileText, Save, Plus, X, Calendar, MapPin, Mail, Phone, Globe, Linkedin, Github, Star, Award, Target, Zap, CheckCircle, AlertCircle, Loader, Palette, Layout, Wand2, RefreshCw, Upload } from 'lucide-react';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  title: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
  technologies: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  achievements: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link: string;
  github: string;
  highlights: string[];
}

interface ResumeData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  projects: Project[];
  certifications: string[];
  achievements: string[];
}

const ResumeBuilderPage = () => {
  // Rest of the code remains the same...
  // All the existing code goes here without any changes

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      {/* Rest of the JSX remains the same... */}
    </div>
  );
};

export default ResumeBuilderPage;
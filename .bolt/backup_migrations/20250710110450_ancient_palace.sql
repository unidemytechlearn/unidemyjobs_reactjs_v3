/*
  # Add Sample Companies and Jobs Data

  1. New Data
    - Insert 6 sample companies across different industries
    - Insert 11 sample jobs with various types and experience levels
    - Realistic job descriptions, requirements, and benefits

  2. Features
    - Companies: TechFlow, Creative Design Studio, DataInsight Analytics, etc.
    - Jobs: Frontend Developer, UX Designer, Data Scientist, Marketing roles, etc.
    - Mix of full-time, part-time, contract, internship, and freelance positions
    - Proper foreign key relationships between jobs and companies

  3. Data Quality
    - All UUIDs are properly formatted
    - Realistic salary ranges and job requirements
    - Comprehensive job descriptions and company information
*/

-- Insert sample companies
INSERT INTO companies (
  id,
  name,
  description,
  industry,
  size_range,
  location,
  website_url,
  logo_url,
  rating,
  review_count,
  founded_year,
  specialties,
  benefits,
  culture_description,
  is_featured
) VALUES 
(
  'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,
  'TechFlow Solutions',
  'Leading technology company specializing in cloud computing, AI, and enterprise software solutions. We help businesses transform digitally and scale efficiently.',
  'Technology',
  '1000-5000',
  'San Francisco, CA',
  'https://techflow.com',
  'https://images.pexels.com/photos/450035/pexels-photo-450035.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
  4.8,
  1247,
  2015,
  ARRAY['Cloud Computing', 'Artificial Intelligence', 'Enterprise Software', 'DevOps'],
  ARRAY['Health Insurance', 'Remote Work', '401k Matching', 'Stock Options', 'Unlimited PTO', 'Learning Budget'],
  'Innovation-driven culture with focus on work-life balance, continuous learning, and collaborative problem-solving.',
  true
),
(
  'b2c3d4e5-f6a7-8901-2345-678901bcdefb'::uuid,
  'Creative Design Studio',
  'Award-winning design agency creating beautiful, functional digital experiences for brands worldwide. We combine creativity with strategy to deliver exceptional results.',
  'Design',
  '50-200',
  'New York, NY',
  'https://creativedesign.com',
  'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
  4.9,
  456,
  2018,
  ARRAY['UI/UX Design', 'Brand Identity', 'Digital Marketing', 'Web Development'],
  ARRAY['Health Insurance', 'Creative Freedom', 'Professional Development', 'Flexible PTO', 'Design Tools Budget'],
  'Creative and collaborative environment that values artistic expression, innovation, and client satisfaction.',
  true
),
(
  'c3d4e5f6-a7b8-9012-3456-789012cdefab'::uuid,
  'DataInsight Analytics',
  'Data analytics company helping businesses make data-driven decisions through advanced analytics, machine learning, and business intelligence solutions.',
  'Data & Analytics',
  '200-500',
  'Austin, TX',
  'https://datainsight.com',
  'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
  4.7,
  623,
  2017,
  ARRAY['Data Science', 'Machine Learning', 'Business Intelligence', 'Analytics'],
  ARRAY['Health Insurance', 'Remote Work', 'Learning Stipend', 'Performance Bonuses', 'Conference Attendance'],
  'Data-driven culture with focus on continuous improvement, innovation, and evidence-based decision making.',
  false
),
(
  'd4e5f6a7-b8c9-0123-4567-890123defabc'::uuid,
  'GrowthHack Marketing',
  'Digital marketing agency specializing in growth hacking, performance marketing, and data-driven customer acquisition strategies.',
  'Marketing',
  '50-200',
  'Los Angeles, CA',
  'https://growthhack.com',
  'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
  4.5,
  234,
  2019,
  ARRAY['Digital Marketing', 'Growth Hacking', 'Performance Marketing', 'SEO/SEM'],
  ARRAY['Health Insurance', 'Flexible Hours', 'Results Bonuses', 'Team Retreats', 'Marketing Tools Access'],
  'Results-oriented culture with focus on experimentation, rapid growth, and creative problem-solving.',
  false
),
(
  'e5f6a7b8-c9d0-1234-5678-901234efabcd'::uuid,
  'CloudScale Infrastructure',
  'Cloud infrastructure provider serving enterprise clients worldwide with scalable, secure, and reliable cloud solutions.',
  'Technology',
  '1000-5000',
  'Seattle, WA',
  'https://cloudscale.com',
  'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
  4.6,
  1089,
  2012,
  ARRAY['Cloud Infrastructure', 'DevOps', 'Security', 'Enterprise Solutions'],
  ARRAY['Health Insurance', 'Stock Options', '401k Matching', 'Parental Leave', 'Professional Development'],
  'Engineering excellence with strong emphasis on reliability, scalability, and customer success.',
  true
),
(
  'f6a7b8c9-d0e1-2345-6789-012345fabcde'::uuid,
  'FinTech Innovations',
  'Financial technology company revolutionizing personal finance management and investment solutions for the modern consumer.',
  'Finance',
  '500-1000',
  'Chicago, IL',
  'https://fintechinnovations.com',
  'https://images.pexels.com/photos/267371/pexels-photo-267371.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop',
  4.7,
  567,
  2016,
  ARRAY['FinTech', 'Personal Finance', 'Investment Tools', 'Mobile Banking'],
  ARRAY['Health Insurance', 'Financial Planning', 'Stock Options', 'Wellness Programs', 'Flexible Work'],
  'Mission-driven culture focused on financial empowerment, inclusion, and innovative solutions.',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (
  id,
  title,
  description,
  company_id,
  location,
  job_type,
  experience_level,
  salary_min,
  salary_max,
  salary_currency,
  is_remote,
  requirements,
  benefits,
  skills_required,
  application_deadline,
  is_featured,
  is_active,
  created_by
) VALUES 
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Senior Frontend Developer',
  'We are seeking a talented Senior Frontend Developer to join our dynamic engineering team. You will be responsible for building responsive, high-performance web applications using modern JavaScript frameworks. This role offers the opportunity to work on cutting-edge projects that impact millions of users worldwide.

Key Responsibilities:
• Develop and maintain complex web applications using React, TypeScript, and modern frontend technologies
• Collaborate with designers and backend engineers to implement pixel-perfect, responsive user interfaces
• Optimize application performance and ensure cross-browser compatibility
• Mentor junior developers and contribute to technical decision-making
• Participate in code reviews and maintain high code quality standards
• Work with product managers to translate business requirements into technical solutions

What We Offer:
• Competitive salary and equity package
• Comprehensive health, dental, and vision insurance
• Flexible work arrangements including remote options
• Professional development budget for conferences and courses
• State-of-the-art equipment and tools
• Collaborative and inclusive work environment',
  'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,
  'San Francisco, CA',
  'Full Time',
  'Senior',
  120000,
  160000,
  'USD',
  false,
  ARRAY[
    '5+ years of experience in frontend development',
    'Expert knowledge of React, TypeScript, and modern JavaScript',
    'Experience with state management libraries (Redux, Zustand)',
    'Proficiency in CSS-in-JS solutions and responsive design',
    'Experience with testing frameworks (Jest, React Testing Library)',
    'Knowledge of build tools and CI/CD pipelines',
    'Strong problem-solving and communication skills',
    'Bachelor''s degree in Computer Science or equivalent experience'
  ],
  ARRAY[
    'Health, dental, and vision insurance',
    'Flexible work arrangements',
    'Stock options and equity participation',
    '401(k) with company matching',
    'Unlimited PTO policy',
    'Professional development budget',
    'Top-tier equipment and tools',
    'Catered meals and snacks'
  ],
  ARRAY['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Redux', 'Jest', 'Git'],
  '2025-02-15',
  true,
  true,
  NULL
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'UX/UI Designer',
  'Join our creative team as a UX/UI Designer and help shape the future of digital experiences. You will work on diverse projects ranging from mobile apps to enterprise software, creating intuitive and beautiful user interfaces that delight our clients and their users.

Key Responsibilities:
• Design user-centered digital experiences from concept to completion
• Create wireframes, prototypes, and high-fidelity mockups
• Conduct user research and usability testing
• Collaborate with developers to ensure design implementation
• Maintain and evolve design systems and style guides
• Present design concepts to clients and stakeholders
• Stay current with design trends and best practices

What Makes This Role Special:
• Work with Fortune 500 clients on high-impact projects
• Access to the latest design tools and software
• Opportunity to shape design processes and methodologies
• Collaborative environment with talented designers and developers
• Regular design critiques and feedback sessions
• Flexible creative freedom with supportive guidance',
  'b2c3d4e5-f6a7-8901-2345-678901bcdefb'::uuid,
  'New York, NY',
  'Full Time',
  'Mid-level',
  75000,
  95000,
  'USD',
  false,
  ARRAY[
    '3-5 years of UX/UI design experience',
    'Proficiency in Figma, Sketch, and Adobe Creative Suite',
    'Strong portfolio demonstrating design process and outcomes',
    'Experience with user research and usability testing',
    'Knowledge of design systems and component libraries',
    'Understanding of frontend development principles',
    'Excellent communication and presentation skills',
    'Bachelor''s degree in Design, HCI, or related field'
  ],
  ARRAY[
    'Comprehensive health insurance',
    'Creative freedom and autonomy',
    'Professional development opportunities',
    'Flexible PTO and work arrangements',
    'Design tools and software budget',
    'Regular team outings and events',
    'Mentorship and career growth support',
    'Beautiful office space in Manhattan'
  ],
  ARRAY['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'Design Systems'],
  '2025-02-20',
  true,
  true,
  NULL
),
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Data Scientist',
  'We are looking for a passionate Data Scientist to join our analytics team and help drive data-driven decision making across the organization. You will work with large datasets, build predictive models, and translate complex data insights into actionable business recommendations.

Key Responsibilities:
• Analyze large, complex datasets to identify trends and patterns
• Build and deploy machine learning models for predictive analytics
• Create data visualizations and dashboards for stakeholders
• Collaborate with cross-functional teams to solve business problems
• Design and conduct A/B tests and experiments
• Develop automated reporting and monitoring systems
• Present findings and recommendations to executive leadership

Growth Opportunities:
• Lead high-impact projects with direct business impact
• Mentor junior data scientists and analysts
• Contribute to our open-source data science tools
• Attend top-tier conferences and training programs
• Work with cutting-edge technologies and methodologies
• Shape the future of data science at our company',
  'c3d4e5f6-a7b8-9012-3456-789012cdefab'::uuid,
  'Austin, TX',
  'Full Time',
  'Mid-level',
  95000,
  125000,
  'USD',
  true,
  ARRAY[
    '3+ years of experience in data science or analytics',
    'Strong programming skills in Python and R',
    'Experience with machine learning frameworks (scikit-learn, TensorFlow)',
    'Proficiency in SQL and database technologies',
    'Knowledge of statistical analysis and experimental design',
    'Experience with data visualization tools (Tableau, Power BI)',
    'Strong analytical and problem-solving skills',
    'Master''s degree in Data Science, Statistics, or related field preferred'
  ],
  ARRAY[
    'Competitive salary and performance bonuses',
    'Remote work flexibility',
    'Learning and development stipend',
    'Conference attendance opportunities',
    'Health and wellness benefits',
    'Collaborative and innovative work environment',
    'Access to cutting-edge tools and technologies',
    'Career advancement opportunities'
  ],
  ARRAY['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Tableau', 'TensorFlow', 'scikit-learn'],
  '2025-02-28',
  false,
  true,
  NULL
),
(
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Digital Marketing Specialist',
  'Join our fast-growing marketing team as a Digital Marketing Specialist and help drive customer acquisition and brand awareness through innovative digital campaigns. You will work on diverse marketing channels and have the opportunity to experiment with cutting-edge marketing technologies.

Key Responsibilities:
• Develop and execute digital marketing campaigns across multiple channels
• Manage social media accounts and content creation
• Optimize campaigns for performance and ROI
• Conduct market research and competitive analysis
• Create compelling marketing content and copy
• Analyze campaign performance and provide insights
• Collaborate with design and development teams
• Stay current with digital marketing trends and best practices

What You''ll Love About This Role:
• Work with innovative marketing technologies and tools
• Direct impact on company growth and success
• Creative freedom to test new marketing strategies
• Collaborative team environment with regular brainstorming sessions
• Opportunity to work with diverse clients and industries
• Regular training and skill development opportunities',
  'd4e5f6a7-b8c9-0123-4567-890123defabc'::uuid,
  'Los Angeles, CA',
  'Full Time',
  'Entry-level',
  55000,
  70000,
  'USD',
  false,
  ARRAY[
    '1-3 years of digital marketing experience',
    'Knowledge of Google Ads, Facebook Ads, and other platforms',
    'Experience with marketing automation tools',
    'Strong analytical skills and attention to detail',
    'Excellent written and verbal communication skills',
    'Familiarity with SEO and content marketing',
    'Basic knowledge of HTML/CSS is a plus',
    'Bachelor''s degree in Marketing, Communications, or related field'
  ],
  ARRAY[
    'Health insurance and wellness benefits',
    'Flexible work hours',
    'Performance-based bonuses',
    'Team retreats and company events',
    'Access to premium marketing tools',
    'Professional development opportunities',
    'Collaborative and creative work environment',
    'Career growth and advancement paths'
  ],
  ARRAY['Google Ads', 'Facebook Ads', 'SEO', 'Content Marketing', 'Analytics', 'Social Media'],
  '2025-03-05',
  false,
  true,
  NULL
),
(
  '55555555-5555-5555-5555-555555555555'::uuid,
  'DevOps Engineer',
  'We are seeking an experienced DevOps Engineer to join our infrastructure team and help scale our cloud platform to serve millions of users. You will work with cutting-edge technologies and have the opportunity to shape our infrastructure architecture and deployment processes.

Key Responsibilities:
• Design and maintain scalable cloud infrastructure on AWS/Azure
• Implement and optimize CI/CD pipelines
• Monitor system performance and ensure high availability
• Automate deployment and infrastructure management processes
• Collaborate with development teams on application architecture
• Implement security best practices and compliance requirements
• Troubleshoot and resolve production issues
• Contribute to disaster recovery and business continuity planning

Why You''ll Thrive Here:
• Work with enterprise-scale infrastructure serving millions of users
• Access to latest cloud technologies and tools
• Collaborative environment with talented engineers
• Opportunity to mentor junior team members
• Flexible work arrangements and remote options
• Continuous learning and professional development support',
  'e5f6a7b8-c9d0-1234-5678-901234efabcd'::uuid,
  'Seattle, WA',
  'Full Time',
  'Senior',
  110000,
  140000,
  'USD',
  true,
  ARRAY[
    '5+ years of DevOps or infrastructure engineering experience',
    'Expert knowledge of AWS or Azure cloud platforms',
    'Experience with containerization (Docker, Kubernetes)',
    'Proficiency in Infrastructure as Code (Terraform, CloudFormation)',
    'Strong scripting skills (Python, Bash, PowerShell)',
    'Experience with monitoring and logging tools',
    'Knowledge of security best practices and compliance',
    'Bachelor''s degree in Computer Science or equivalent experience'
  ],
  ARRAY[
    'Competitive salary and stock options',
    'Comprehensive health benefits',
    '401(k) with company matching',
    'Flexible work arrangements',
    'Professional development budget',
    'Parental leave and family support',
    'State-of-the-art equipment',
    'Collaborative and inclusive culture'
  ],
  ARRAY['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Python', 'CI/CD', 'Monitoring', 'Security'],
  '2025-03-10',
  true,
  true,
  NULL
),
(
  '66666666-6666-6666-6666-666666666666'::uuid,
  'Product Manager',
  'Join our product team as a Product Manager and help drive the development of innovative financial technology solutions. You will work closely with engineering, design, and business teams to deliver products that transform how people manage their finances.

Key Responsibilities:
• Define product strategy and roadmap based on market research and user feedback
• Work with engineering teams to prioritize features and manage development cycles
• Conduct user research and analyze product metrics
• Collaborate with design teams to create intuitive user experiences
• Coordinate product launches and go-to-market strategies
• Communicate product vision and updates to stakeholders
• Monitor competitive landscape and industry trends
• Ensure products meet regulatory and compliance requirements

What Makes This Opportunity Special:
• Direct impact on financial inclusion and user empowerment
• Work with cutting-edge fintech technologies
• Collaborate with cross-functional teams across the organization
• Opportunity to shape product strategy and vision
• Access to comprehensive user data and analytics
• Regular interaction with customers and stakeholders',
  'f6a7b8c9-d0e1-2345-6789-012345fabcde'::uuid,
  'Chicago, IL',
  'Full Time',
  'Mid-level',
  100000,
  130000,
  'USD',
  false,
  ARRAY[
    '3-5 years of product management experience',
    'Experience in fintech or financial services preferred',
    'Strong analytical and problem-solving skills',
    'Excellent communication and presentation abilities',
    'Knowledge of agile development methodologies',
    'Experience with product analytics tools',
    'Understanding of user experience design principles',
    'MBA or Bachelor''s degree in Business, Engineering, or related field'
  ],
  ARRAY[
    'Competitive salary and equity package',
    'Comprehensive health and wellness benefits',
    'Financial planning and investment support',
    'Flexible work arrangements',
    'Professional development opportunities',
    'Regular team building and company events',
    'Access to industry conferences and training',
    'Collaborative and mission-driven culture'
  ],
  ARRAY['Product Management', 'Analytics', 'Agile', 'User Research', 'Strategy', 'Fintech'],
  '2025-03-15',
  false,
  true,
  NULL
),
(
  '77777777-7777-7777-7777-777777777777'::uuid,
  'Frontend Developer Intern',
  'Join our engineering team as a Frontend Developer Intern and gain hands-on experience building modern web applications. This is a fantastic opportunity for students or recent graduates to learn from experienced developers and contribute to real-world projects.

Key Responsibilities:
• Assist in developing user interfaces using React and TypeScript
• Work on responsive design and cross-browser compatibility
• Participate in code reviews and team meetings
• Learn and apply best practices in frontend development
• Collaborate with designers to implement UI/UX designs
• Write unit tests and contribute to documentation
• Participate in agile development processes
• Present your work and learnings to the team

What You''ll Gain:
• Mentorship from senior developers and tech leads
• Hands-on experience with modern frontend technologies
• Exposure to real-world software development practices
• Opportunity to contribute to products used by thousands of users
• Networking opportunities within the tech industry
• Potential for full-time offer upon successful completion',
  'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,
  'San Francisco, CA',
  'Internship',
  'Entry-level',
  25,
  30,
  'USD',
  false,
  ARRAY[
    'Currently pursuing or recently completed degree in Computer Science or related field',
    'Basic knowledge of HTML, CSS, and JavaScript',
    'Familiarity with React or other frontend frameworks',
    'Understanding of version control (Git)',
    'Strong problem-solving and learning abilities',
    'Excellent communication and teamwork skills',
    'Passion for web development and technology',
    'Available for 12-week internship program'
  ],
  ARRAY[
    'Competitive hourly compensation',
    'Mentorship and career guidance',
    'Access to learning resources and training',
    'Networking opportunities',
    'Flexible work arrangements',
    'Team events and social activities',
    'Potential for full-time offer',
    'Real-world project experience'
  ],
  ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'TypeScript'],
  '2025-04-01',
  false,
  true,
  NULL
),
(
  '88888888-8888-8888-8888-888888888888'::uuid,
  'Freelance Graphic Designer',
  'We are seeking talented freelance graphic designers to join our creative network and work on exciting client projects. This is a perfect opportunity for experienced designers looking for flexible work arrangements and diverse creative challenges.

Key Responsibilities:
• Create visual designs for various marketing materials and campaigns
• Develop brand identities and style guides for clients
• Design digital assets for web and social media
• Collaborate with our creative team and account managers
• Present design concepts and iterate based on feedback
• Ensure designs meet brand guidelines and project requirements
• Manage multiple projects and meet tight deadlines
• Maintain high quality standards across all deliverables

Why Work With Us:
• Flexible schedule and remote work options
• Diverse range of clients and project types
• Competitive project-based compensation
• Opportunity to work with award-winning creative team
• Access to premium design tools and resources
• Potential for long-term partnership and growth',
  'b2c3d4e5-f6a7-8901-2345-678901bcdefb'::uuid,
  'Remote',
  'Freelancing',
  'Mid-level',
  50,
  85,
  'USD',
  true,
  ARRAY[
    '3+ years of professional graphic design experience',
    'Strong portfolio demonstrating diverse design skills',
    'Proficiency in Adobe Creative Suite (Photoshop, Illustrator, InDesign)',
    'Experience with brand identity and marketing design',
    'Knowledge of print and digital design requirements',
    'Excellent time management and communication skills',
    'Ability to work independently and meet deadlines',
    'Bachelor''s degree in Graphic Design or equivalent experience'
  ],
  ARRAY[
    'Competitive hourly rates',
    'Flexible work schedule',
    'Remote work opportunities',
    'Access to premium design tools',
    'Diverse and interesting projects',
    'Collaborative creative environment',
    'Potential for ongoing partnership',
    'Professional development opportunities'
  ],
  ARRAY['Adobe Creative Suite', 'Photoshop', 'Illustrator', 'InDesign', 'Brand Design', 'Print Design'],
  '2025-04-15',
  false,
  true,
  NULL
),
(
  '99999999-9999-9999-9999-999999999999'::uuid,
  'Part-Time Marketing Assistant',
  'Join our marketing team as a Part-Time Marketing Assistant and help support our growing digital marketing efforts. This role is perfect for students, career changers, or professionals seeking flexible work arrangements while gaining valuable marketing experience.

Key Responsibilities:
• Assist with social media content creation and scheduling
• Support email marketing campaigns and automation
• Help with market research and competitive analysis
• Create basic graphics and marketing materials
• Assist with event planning and coordination
• Update website content and blog posts
• Track and report on marketing metrics
• Provide general administrative support to the marketing team

Perfect For:
• Students looking to gain real-world marketing experience
• Career changers interested in entering the marketing field
• Parents or professionals seeking flexible work arrangements
• Anyone passionate about digital marketing and growth
• Individuals looking to build their marketing portfolio
• Those interested in startup culture and fast-paced environment',
  'd4e5f6a7-b8c9-0123-4567-890123defabc'::uuid,
  'Los Angeles, CA',
  'Part Time',
  'Entry-level',
  20,
  25,
  'USD',
  false,
  ARRAY[
    'Strong interest in digital marketing and social media',
    'Basic knowledge of social media platforms',
    'Excellent written and verbal communication skills',
    'Proficiency in Microsoft Office or Google Workspace',
    'Detail-oriented with strong organizational skills',
    'Ability to work 20-25 hours per week',
    'Positive attitude and willingness to learn',
    'High school diploma or equivalent required'
  ],
  ARRAY[
    'Competitive hourly wage',
    'Flexible scheduling options',
    'Hands-on marketing experience',
    'Mentorship and training opportunities',
    'Potential for increased hours/responsibilities',
    'Fun and collaborative work environment',
    'Access to marketing tools and resources',
    'Networking opportunities in the industry'
  ],
  ARRAY['Social Media', 'Content Creation', 'Email Marketing', 'Microsoft Office', 'Communication'],
  '2025-05-01',
  false,
  true,
  NULL
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Senior Backend Engineer',
  'We are looking for a Senior Backend Engineer to join our core platform team and help build scalable, high-performance systems that power our applications. You will work on challenging technical problems and have the opportunity to architect solutions that serve millions of users.

Key Responsibilities:
• Design and develop scalable backend services and APIs
• Optimize database performance and implement caching strategies
• Build and maintain microservices architecture
• Implement security best practices and data protection measures
• Collaborate with frontend teams to define API contracts
• Monitor system performance and troubleshoot production issues
• Mentor junior engineers and contribute to technical decisions
• Participate in on-call rotation and incident response

Technical Challenges You''ll Tackle:
• Building systems that handle millions of requests per day
• Implementing real-time data processing and analytics
• Designing fault-tolerant and resilient architectures
• Optimizing for performance, scalability, and cost efficiency
• Working with large-scale distributed systems
• Implementing advanced security and compliance requirements',
  'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,
  'San Francisco, CA',
  'Full Time',
  'Senior',
  140000,
  180000,
  'USD',
  true,
  ARRAY[
    '6+ years of backend development experience',
    'Expert knowledge of Python, Java, or Go',
    'Experience with microservices and distributed systems',
    'Strong database design and optimization skills',
    'Knowledge of cloud platforms (AWS, GCP, Azure)',
    'Experience with containerization and orchestration',
    'Understanding of security best practices',
    'Bachelor''s degree in Computer Science or equivalent'
  ],
  ARRAY[
    'Competitive salary and equity package',
    'Comprehensive health benefits',
    'Remote work flexibility',
    'Professional development budget',
    'Stock options and 401(k) matching',
    'Unlimited PTO policy',
    'Top-tier equipment and tools',
    'Collaborative engineering culture'
  ],
  ARRAY['Python', 'Java', 'Go', 'Microservices', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL'],
  '2025-03-20',
  true,
  true,
  NULL
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'Junior Software Engineer',
  'Join our engineering team as a Junior Software Engineer and kickstart your career in software development. This is an excellent opportunity for recent graduates or career changers to learn from experienced developers while contributing to meaningful projects.

Key Responsibilities:
• Develop and maintain web applications using modern technologies
• Write clean, efficient, and well-documented code
• Participate in code reviews and team collaboration
• Learn and apply software engineering best practices
• Work on bug fixes and feature enhancements
• Contribute to testing and quality assurance processes
• Participate in agile development methodologies
• Grow your technical skills through mentorship and training

What We Offer:
• Comprehensive mentorship program
• Structured learning and development path
• Exposure to cutting-edge technologies
• Collaborative and supportive team environment
• Opportunity to work on diverse projects
• Clear career progression opportunities',
  'a1b2c3d4-e5f6-7890-1234-567890abcdef'::uuid,
  'San Francisco, CA',
  'Full Time',
  'Entry-level',
  85000,
  105000,
  'USD',
  false,
  ARRAY[
    'Bachelor''s degree in Computer Science or related field',
    'Basic knowledge of programming languages (JavaScript, Python, Java)',
    'Understanding of web development fundamentals',
    'Familiarity with version control systems (Git)',
    'Strong problem-solving and analytical skills',
    'Excellent communication and teamwork abilities',
    'Eagerness to learn and adapt to new technologies',
    'Previous internship or project experience preferred'
  ],
  ARRAY[
    'Competitive entry-level salary',
    'Comprehensive health benefits',
    'Mentorship and career development',
    'Learning and training budget',
    'Flexible work arrangements',
    'Stock options and equity participation',
    'Modern office environment',
    'Team building and social events'
  ],
  ARRAY['JavaScript', 'Python', 'Java', 'HTML', 'CSS', 'Git', 'SQL', 'React'],
  '2025-03-25',
  false,
  true,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Update job application counts (this will be handled by triggers, but we'll set initial values)
UPDATE jobs SET 
  total_applications = 0,
  new_applications = 0,
  applications_in_review = 0,
  applications_interviewed = 0,
  applications_hired = 0
WHERE total_applications IS NULL;
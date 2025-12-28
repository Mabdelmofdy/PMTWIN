/**
 * PMTwin Landing Page Data
 * Centralized data store for all landing page content
 */

const siteData = {
  // Hero Section
  hero: {
    title: "Digitize Construction Collaboration in MENA",
    subtitle: "Connect, collaborate, and execute mega-projects through intelligent matching and flexible resource exchange. Transform how construction companies partner, share resources, and grow together.",
    ctaText: "Get Started",
    ctaLink: "public-portal.html#signup",
    secondaryCtaText: "Explore Projects",
    secondaryCtaLink: "public-portal.html#discovery",
    backgroundImage: "https://picsum.photos/1920/1080?random=construction"
  },

  // About Section
  about: {
    heading: "Revolutionizing Construction Collaboration",
    description: "PMTwin is the first comprehensive platform designed specifically for the MENA construction industry. We bridge the gap between mega-project owners, contractors, suppliers, and consultants through data-driven matching and innovative collaboration models.",
    image: "https://picsum.photos/600/400?random=about",
    features: [
      {
        title: "Intelligent Matching",
        description: "AI-powered algorithms connect the right partners based on capabilities, resources, and project requirements."
      },
      {
        title: "Flexible Models",
        description: "Support for Joint Ventures, Consortia, Resource Pooling, Barter Exchanges, and more collaboration structures."
      },
      {
        title: "MENA Focus",
        description: "Built specifically for the Middle East and North Africa construction ecosystem with local regulations and practices in mind."
      },
      {
        title: "Transparent Operations",
        description: "Complete visibility into project progress, resource allocation, and financial health tracking."
      }
    ]
  },

  // Services Section
  services: [
    {
      title: "Project-Based Collaboration",
      description: "Find partners for specific projects through Joint Ventures and Consortia. Match with companies that complement your capabilities and share your vision.",
      icon: "https://placehold.co/80x80/6366f1/ffffff?text=JV",
      link: "public-portal.html#collaboration-models"
    },
    {
      title: "Resource Pooling & Sharing",
      description: "Share equipment, facilities, and expertise with other companies. Maximize utilization and reduce costs through strategic resource exchange.",
      icon: "https://placehold.co/80x80/8b5cf6/ffffff?text=RP",
      link: "public-portal.html#collaboration-models"
    },
    {
      title: "Barter Exchange Network",
      description: "Trade services and resources without cash transactions. Exchange construction services, materials, or expertise in a structured, transparent marketplace.",
      icon: "https://placehold.co/80x80/ec4899/ffffff?text=BE",
      link: "public-portal.html#collaboration-models"
    },
    {
      title: "Talent Matching",
      description: "Connect consultants and professionals with projects that match their expertise. Task-based engagements and skill-verified opportunities.",
      icon: "https://placehold.co/80x80/10b981/ffffff?text=TM",
      link: "public-portal.html#signup"
    },
    {
      title: "Bulk Purchasing",
      description: "Access group purchasing power for materials and equipment. Combine orders with other companies to negotiate better prices and terms.",
      icon: "https://placehold.co/80x80/f59e0b/ffffff?text=BP",
      link: "public-portal.html#signup"
    },
    {
      title: "Financial Health Tracking",
      description: "Monitor and verify the financial stability of potential partners. Make informed decisions with transparent financial health indicators.",
      icon: "https://placehold.co/80x80/3b82f6/ffffff?text=FH",
      link: "public-portal.html#signup"
    }
  ],

  // Portfolio Section (Featured Projects)
  portfolio: [
    {
      title: "Riyadh Metro Expansion",
      category: "Infrastructure",
      description: "Multi-billion dollar metro system expansion connecting new districts across the capital city.",
      image: "https://picsum.photos/400/300?random=project1",
      link: "public-portal.html#discovery"
    },
    {
      title: "Dubai Marina Towers",
      category: "Residential",
      description: "Luxury residential complex with sustainable design and smart building technologies.",
      image: "https://picsum.photos/400/300?random=project2",
      link: "public-portal.html#discovery"
    },
    {
      title: "NEOM Industrial Zone",
      category: "Industrial",
      description: "State-of-the-art industrial facility supporting the future city's manufacturing needs.",
      image: "https://picsum.photos/400/300?random=project3",
      link: "public-portal.html#discovery"
    },
    {
      title: "Cairo Airport Terminal",
      category: "Infrastructure",
      description: "Modern airport terminal expansion with advanced passenger processing systems.",
      image: "https://picsum.photos/400/300?random=project4",
      link: "public-portal.html#discovery"
    },
    {
      title: "Abu Dhabi Cultural District",
      category: "Cultural",
      description: "World-class cultural complex featuring museums, theaters, and exhibition spaces.",
      image: "https://picsum.photos/400/300?random=project5",
      link: "public-portal.html#discovery"
    },
    {
      title: "Jeddah Waterfront Development",
      category: "Mixed-Use",
      description: "Integrated waterfront development combining residential, commercial, and recreational spaces.",
      image: "https://picsum.photos/400/300?random=project6",
      link: "public-portal.html#discovery"
    }
  ],

  // Testimonials Section
  testimonials: [
    {
      name: "Ahmed Al-Mansouri",
      role: "CEO",
      company: "Al-Mansouri Construction Group",
      comment: "PMTwin transformed how we find partners for mega-projects. The intelligent matching saved us months of searching and helped us form a successful consortium for the Riyadh Metro project.",
      avatar: "https://picsum.photos/100/100?random=person1"
    },
    {
      name: "Sarah Hassan",
      role: "Project Director",
      company: "Dubai Infrastructure Partners",
      comment: "The resource pooling feature allowed us to share expensive equipment with other companies, reducing our capital expenditure by 30% while maintaining full project capacity.",
      avatar: "https://picsum.photos/100/100?random=person2"
    },
    {
      name: "Mohammed Farid",
      role: "Senior Consultant",
      company: "Independent",
      comment: "As a consultant, PMTwin connected me with projects that perfectly matched my expertise. The platform's verification system gave clients confidence in my credentials.",
      avatar: "https://picsum.photos/100/100?random=person3"
    },
    {
      name: "Fatima Al-Zahra",
      role: "Operations Manager",
      company: "Cairo Builders Co.",
      comment: "The barter exchange network helped us trade excess materials for services we needed, improving cash flow and reducing waste. It's a game-changer for the industry.",
      avatar: "https://picsum.photos/100/100?random=person4"
    }
  ],

  // Team Section
  team: [
    {
      name: "Khalid Al-Rashid",
      position: "Founder & CEO",
      bio: "20+ years in construction and technology. Former VP at a leading MENA construction firm.",
      photo: "https://picsum.photos/200/200?random=team1",
      socialLinks: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      }
    },
    {
      name: "Layla Al-Mahmoud",
      position: "CTO",
      bio: "Tech entrepreneur with expertise in B2B platforms and AI-driven matching algorithms.",
      photo: "https://picsum.photos/200/200?random=team2",
      socialLinks: {
        linkedin: "https://linkedin.com",
        github: "https://github.com"
      }
    },
    {
      name: "Omar Hassan",
      position: "Head of Partnerships",
      bio: "Construction industry veteran with deep connections across MENA markets.",
      photo: "https://picsum.photos/200/200?random=team3",
      socialLinks: {
        linkedin: "https://linkedin.com"
      }
    },
    {
      name: "Nour Al-Din",
      position: "Product Director",
      bio: "Product strategist specializing in marketplace platforms and user experience design.",
      photo: "https://picsum.photos/200/200?random=team4",
      socialLinks: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com"
      }
    }
  ],

  // Contact Section
  contact: {
    address: {
      street: "Business Bay, Dubai",
      city: "Dubai",
      country: "United Arab Emirates",
      full: "Business Bay, Dubai, United Arab Emirates"
    },
    phone: "+971 4 XXX XXXX",
    email: "contact@pmtwin.com",
    socialLinks: {
      linkedin: "https://linkedin.com/company/pmtwin",
      twitter: "https://twitter.com/pmtwin",
      facebook: "https://facebook.com/pmtwin",
      instagram: "https://instagram.com/pmtwin"
    }
  },

  // Footer Section
  footer: {
    links: [
      {
        category: "Platform",
        items: [
          { text: "Discover Projects", url: "public-portal.html#discovery" },
          { text: "PMTwin Wizard", url: "public-portal.html#wizard" },
          { text: "Knowledge Hub", url: "public-portal.html#knowledge" },
          { text: "Collaboration Models", url: "public-portal.html#collaboration-models" }
        ]
      },
      {
        category: "Company",
        items: [
          { text: "About Us", url: "#about" },
          { text: "Our Team", url: "#team" },
          { text: "Contact", url: "#contact" },
          { text: "Careers", url: "#" }
        ]
      },
      {
        category: "Resources",
        items: [
          { text: "Help Center", url: "#" },
          { text: "Documentation", url: "#" },
          { text: "API Access", url: "#" },
          { text: "Blog", url: "#" }
        ]
      },
      {
        category: "Legal",
        items: [
          { text: "Privacy Policy", url: "#" },
          { text: "Terms of Service", url: "#" },
          { text: "Cookie Policy", url: "#" },
          { text: "Disclaimer", url: "#" }
        ]
      }
    ],
    copyright: "© 2024 PMTwin. All rights reserved.",
    additionalInfo: "PMTwin is committed to transforming construction collaboration across the MENA region through innovative technology and transparent partnerships."
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.siteData = siteData;
}


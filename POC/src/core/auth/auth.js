/**
 * PMTwin Authentication System
 * Handles registration, login, logout, session management, and role-based access
 */

(function() {
  'use strict';

  // Simple password encoding (NOT secure - POC only)
  function encodePassword(password) {
    // Base64 encoding (NOT secure, for POC demonstration only)
    return btoa(password);
  }

  function decodePassword(encoded) {
    try {
      return atob(encoded);
    } catch (e) {
      return null;
    }
  }

  // Validate email format
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validate password strength
  function validatePassword(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }

  // ============================================
  // OTP Generation & Verification
  // ============================================
  function generateOTP() {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function sendOTP(contact, otpCode, type = 'email') {
    // Simulated OTP sending for POC
    // In production, this would call an email/SMS service
    if (type === 'email') {
      console.log(`📧 Email OTP sent to ${contact}: ${otpCode}`);
      console.log(`   (This is a POC - OTP is displayed in console for testing)`);
      
      // Store OTP in a temporary location for demo purposes
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`otp_email_${contact}`, otpCode);
      }
      
      return { success: true, message: 'OTP sent to your email' };
    } else if (type === 'mobile') {
      console.log(`📱 Mobile OTP sent to ${contact}: ${otpCode}`);
      console.log(`   (This is a POC - OTP is displayed in console for testing)`);
      
      // Store OTP in a temporary location for demo purposes
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`otp_mobile_${contact}`, otpCode);
      }
      
      return { success: true, message: 'OTP sent to your mobile number' };
    }
    
    return { success: false, error: 'Invalid OTP type' };
  }

  function verifyOTP(email, otpCode, type = 'email') {
    if (!email || !otpCode) {
      return { success: false, error: 'Email and OTP code required' };
    }

    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const user = PMTwinData.Users.getByEmail(email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check OTP based on type
    let otpField, expiresField;
    if (type === 'email') {
      otpField = user.emailOTP || user.otpCode; // Fallback to legacy field
      expiresField = user.otpExpiresAt;
    } else if (type === 'mobile') {
      otpField = user.mobileOTP;
      expiresField = user.otpExpiresAt; // Mobile OTP uses same expiry
    } else {
      return { success: false, error: 'Invalid verification type' };
    }

    // Check if OTP exists and is not expired
    if (!otpField || !expiresField) {
      return { success: false, error: `No ${type} OTP found. Please request a new one.` };
    }

    const now = new Date();
    const expiresAt = new Date(expiresField);
    
    if (now > expiresAt) {
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    if (otpField !== otpCode) {
      return { success: false, error: 'Invalid OTP code' };
    }

    // OTP verified successfully
    const updates = {};
    let newStage = user.onboardingStage;

    if (type === 'email') {
      updates.emailVerified = true;
      updates.emailOTP = null;
    } else if (type === 'mobile') {
      updates.mobileVerified = true;
      updates.mobileOTP = null;
    }

    // Update stage based on verification status
    // If both email and mobile are verified, move to profile_in_progress
    const emailVerified = type === 'email' ? true : user.emailVerified;
    const mobileVerified = type === 'mobile' ? true : user.mobileVerified;

    if (emailVerified && mobileVerified) {
      // Both verified - move to profile_in_progress (all user types)
      newStage = 'profile_in_progress';
      updates.otpCode = null; // Clear legacy OTP
      updates.otpExpiresAt = null;
    }

    updates.onboardingStage = newStage;
    const updatedUserData = { ...user, ...updates };
    updates.onboardingProgress = PMTwinData.calculateOnboardingProgress(
      user.userType || (user.role === 'entity' ? 'company' : 'consultant'),
      newStage,
      updatedUserData
    );

    PMTwinData.Users.update(user.id, updates);

    const message = type === 'email' 
      ? 'Email verified successfully' 
      : 'Mobile number verified successfully';

    return { 
      success: true, 
      message: message,
      allVerified: emailVerified && mobileVerified,
      emailVerified: emailVerified,
      mobileVerified: mobileVerified,
      newStage: newStage
    };
  }

  function requestOTP(email, type = 'email') {
    if (type === 'email' && (!email || !validateEmail(email))) {
      return { success: false, error: 'Valid email required' };
    }

    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const user = PMTwinData.Users.getByEmail(email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Generate new OTP
    const otpResult = PMTwinData.generateOTP(type);
    const updates = {
      otpExpiresAt: otpResult.expiresAt
    };

    if (type === 'email') {
      updates.emailOTP = otpResult.code;
      updates.otpCode = otpResult.code; // Legacy field
    } else if (type === 'mobile') {
      updates.mobileOTP = otpResult.code;
    }

    // Update user with new OTP
    PMTwinData.Users.update(user.id, updates);

    // Send OTP (simulated)
    const contact = type === 'email' ? email : user.mobile;
    sendOTP(contact, otpResult.code, type);

    return { 
      success: true, 
      message: `OTP sent to your ${type}`,
      otpCode: otpResult.code,
      expiresAt: otpResult.expiresAt 
    };
  }

  // ============================================
  // Registration
  // ============================================
  function register(userData) {
    const { email, mobile, password, role, userType, profile } = userData;

    // Validation
    if (!email || !password || !role) {
      return { success: false, error: 'Missing required fields' };
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!validatePassword(password)) {
      return { 
        success: false, 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      };
    }

    if (!['individual', 'entity'].includes(role)) {
      return { success: false, error: 'Invalid role' };
    }

    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    // Check if user already exists
    const existing = PMTwinData.Users.getByEmail(email);
    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    // Generate OTPs for email and mobile verification
    const emailOTPResult = PMTwinData.generateOTP('email');
    const mobileOTPResult = PMTwinData.generateOTP('mobile');

    // Generate device fingerprint
    const deviceFingerprint = PMTwinData.generateDeviceFingerprint();

    // Create user with initial onboarding stage (registered)
    const user = PMTwinData.Users.create({
      email: email,
      mobile: mobile || null,
      password: encodePassword(password),
      role: role,
      userType: userType, // Allow explicit userType (e.g., 'individual' for instant access)
      emailVerified: false,
      mobileVerified: false,
      emailOTP: emailOTPResult.code,
      mobileOTP: mobileOTPResult.code,
      otpCode: emailOTPResult.code, // Legacy field for backward compatibility
      otpExpiresAt: emailOTPResult.expiresAt,
      deviceFingerprint: deviceFingerprint,
      onboardingStage: 'registered', // New onboarding stage
      profile: {
        ...profile,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });

    if (user) {
      // Send OTPs (simulated - display in console and UI)
      sendOTP(email, emailOTPResult.code, 'email');
      if (mobile) {
        sendOTP(mobile, mobileOTPResult.code, 'mobile');
      }

      // Create audit log
      PMTwinData.Audit.create({
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
        userName: user.profile?.name || user.email,
        action: 'user_registration',
        actionCategory: 'user',
        entityType: 'user',
        entityId: user.id,
        description: `User registered: ${user.email} (${user.userType})`,
        context: {
          portal: 'public_portal',
          userAgent: navigator.userAgent,
          deviceFingerprint: deviceFingerprint
        }
      });

      return { 
        success: true, 
        user: user, 
        requiresOTP: true,
        emailOTP: emailOTPResult.code,
        mobileOTP: mobile ? mobileOTPResult.code : null
      };
    }

    return { success: false, error: 'Failed to create user' };
  }

  // ============================================
  // Login (Progressive Authentication)
  // ============================================
  async function login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Email and password required' };
    }

    // Wait for PMTwinData to be available
    if (typeof PMTwinData === 'undefined') {
      // Wait up to 3 seconds for PMTwinData to load
      let waitTime = 0;
      const maxWait = 3000;
      const pollInterval = 50;
      
      while (typeof PMTwinData === 'undefined' && waitTime < maxWait) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        waitTime += pollInterval;
      }
      
      if (typeof PMTwinData === 'undefined') {
        return { success: false, error: 'Data service not available. Please refresh the page.' };
      }
    }

    const user = PMTwinData.Users.getByEmail(email);
    if (!user) {
      // Check if any users exist at all
      const allUsers = PMTwinData.Users.getAll();
      if (allUsers.length === 0) {
        return { 
          success: false, 
          error: 'No accounts found. Please run the setup script first. Open console (F12) and load js/setup-accounts.js' 
        };
      }
      return { success: false, error: 'Invalid email or password' };
    }

    // Check password (POC: basic encoding)
    let decodedPassword = decodePassword(user.password);
    
    // If password decoding fails, try to fix it for known test accounts
    if (!decodedPassword) {
      console.warn('Password decoding failed, attempting to fix...');
      let expectedPassword = null;
      
      // Check common demo account passwords
      const demoPasswords = {
        'admin@pmtwin.com': 'Admin123',
        'individual@pmtwin.com': 'User123',
        'entity@pmtwin.com': 'Entity123',
        'entity2@pmtwin.com': 'Entity123',
        'beneficiary@pmtwin.com': 'Beneficiary123',
        'vendor.alpha@pmtwin.com': 'Vendor123',
        'vendor.beta@pmtwin.com': 'Vendor123',
        'bim@pmtwin.com': 'Service123',
        'qa@pmtwin.com': 'Service123',
        'scheduler@pmtwin.com': 'Service123',
        'consultant@pmtwin.com': 'Consultant123',
        'mep.sub@pmtwin.com': 'SubContractor123',
        'steel.sub@pmtwin.com': 'SubContractor123'
      };
      
      expectedPassword = demoPasswords[user.email];
      
      if (expectedPassword) {
        // Fix the password encoding
        PMTwinData.Users.update(user.id, { password: btoa(expectedPassword) });
        decodedPassword = expectedPassword;
        console.log('✅ Fixed password encoding for', user.email);
      } else {
        // Try to decode as plain text (for backward compatibility)
        try {
          decodedPassword = atob(user.password);
        } catch (e) {
          // If that fails, check if password is already plain text
          if (user.password && user.password.length < 50) {
            decodedPassword = user.password;
            // Re-encode properly
            PMTwinData.Users.update(user.id, { password: btoa(user.password) });
          } else {
            return { success: false, error: 'Password encoding error. Please contact support or reset your password.' };
          }
        }
      }
    }
    
    if (decodedPassword !== password) {
      return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
    }

    // Progressive authentication: Allow login based on onboarding stage
    // Individual users can login immediately after email verification
    // Company and Consultant users need approval for full access
    
    const canLogin = canUserLogin(user);
    if (!canLogin.allowed) {
      return {
        success: false,
        error: canLogin.message,
        status: user.onboardingStage,
        onboardingStage: user.onboardingStage,
        userType: user.userType,
        requiresAction: canLogin.requiresAction
      };
    }

    // Update device fingerprint
    const deviceFingerprint = PMTwinData.generateDeviceFingerprint();
    
    // Create session
    const session = PMTwinData.Sessions.create(user.id, user.role, user.userType, user.onboardingStage);
    if (session) {
      // Update last login and device fingerprint
      PMTwinData.Users.update(user.id, {
        lastLoginAt: new Date().toISOString(),
        deviceFingerprint: deviceFingerprint
      });

      // Create audit log
      PMTwinData.Audit.create({
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
        userName: user.profile?.name || user.email,
        action: 'user_login',
        actionCategory: 'user',
        entityType: 'user',
        entityId: user.id,
        description: `User logged in: ${user.email}`,
        context: {
          portal: 'user_portal',
          userAgent: navigator.userAgent,
          deviceFingerprint: deviceFingerprint,
          onboardingStage: user.onboardingStage
        }
      });

      return { 
        success: true, 
        user: user, 
        session: session,
        onboardingStage: user.onboardingStage,
        onboardingProgress: user.onboardingProgress
      };
    }

    return { success: false, error: 'Failed to create session' };
  }

  // Check if user can login based on onboarding stage
  function canUserLogin(user) {
    if (typeof PMTwinData === 'undefined') {
      return { allowed: false, reason: 'Data service not available' };
    }

    const stage = user.onboardingStage;
    const userType = user.userType;

    // For test accounts or system-created accounts, allow login if they're approved
    // This handles cases where accounts are created via autoCreateTestAccounts
    if (user.profile?.status === 'approved' && (stage === 'approved' || !stage)) {
      // Ensure emailVerified is set for approved accounts
      if (!user.emailVerified) {
        // Auto-verify email for approved test accounts
        PMTwinData.Users.update(user.id, { emailVerified: true });
      }
      return { allowed: true };
    }

    // Individual users can login after email verification
    if (userType === 'individual') {
      // If emailVerified is undefined or null, check if account is approved
      if (user.emailVerified === undefined || user.emailVerified === null) {
        if (user.profile?.status === 'approved') {
          // Auto-verify for approved accounts
          PMTwinData.Users.update(user.id, { emailVerified: true });
          return { allowed: true };
        }
      }
      
      if (stage === 'account_created' || user.emailVerified === false) {
        return {
          allowed: false,
          message: 'Please verify your email address first. Check your inbox for the OTP code.',
          requiresAction: 'verify_email'
        };
      }
      // Individual users can login after email verification
      return { allowed: true };
    }

    // Company and Consultant users
    if (userType === 'company' || userType === 'consultant') {
      // If emailVerified is undefined or null, check if account is approved
      if (user.emailVerified === undefined || user.emailVerified === null) {
        if (user.profile?.status === 'approved') {
          // Auto-verify for approved accounts
          PMTwinData.Users.update(user.id, { emailVerified: true });
          return { allowed: true };
        }
      }
      
      if (stage === 'account_created' || user.emailVerified === false) {
        return {
          allowed: false,
          message: 'Please verify your email address first. Check your inbox for the OTP code.',
          requiresAction: 'verify_email'
        };
      }

      if (stage === 'rejected') {
        return {
          allowed: false,
          message: user.verificationRejectionReason || 'Your account has been rejected. Please contact support for assistance.',
          requiresAction: 'contact_support'
        };
      }

      if (stage === 'suspended') {
        return {
          allowed: false,
          message: 'Your account has been suspended. Please contact support for assistance.',
          requiresAction: 'contact_support'
        };
      }

      // Allow login even if pending verification (progressive access)
      // They can browse but have restricted features
      return { allowed: true };
    }

    // Admin users
    if (userType === 'admin') {
      return { allowed: true };
    }

    return { allowed: false, message: 'Unknown user type' };
  }

  // ============================================
  // Logout
  // ============================================
  function logout() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const session = PMTwinData.Sessions.getCurrentSession();
    if (session) {
      const user = PMTwinData.Users.getById(session.userId);
      
      // Create audit log
      PMTwinData.Audit.create({
        userId: session.userId,
        userRole: session.role,
        userEmail: user?.email || 'unknown',
        userName: user?.profile?.name || 'Unknown',
        action: 'user_logout',
        actionCategory: 'user',
        entityType: 'user',
        entityId: session.userId,
        description: `User logged out: ${user?.email || 'unknown'}`,
        context: {
          portal: 'user_portal'
        }
      });

      // Delete session
      PMTwinData.Sessions.delete(session.token);
    }

    // Clear all sessions (for security)
    PMTwinData.Sessions.deleteAll();
    
    return { success: true };
  }

  // ============================================
  // Session Management
  // ============================================
  function getCurrentUser() {
    if (typeof PMTwinData === 'undefined') {
      return null;
    }
    return PMTwinData.Sessions.getCurrentUser();
  }

  function getCurrentSession() {
    if (typeof PMTwinData === 'undefined') {
      return null;
    }
    return PMTwinData.Sessions.getCurrentSession();
  }

  function isAuthenticated() {
    if (typeof PMTwinData === 'undefined') {
      return false;
    }
    return PMTwinData.Sessions.getCurrentSession() !== null;
  }

  function hasRole(role) {
    if (typeof PMTwinData === 'undefined') {
      return false;
    }
    const session = PMTwinData.Sessions.getCurrentSession();
    return session && session.role === role;
  }

  function hasAnyRole(roles) {
    if (typeof PMTwinData === 'undefined') {
      return false;
    }
    const session = PMTwinData.Sessions.getCurrentSession();
    return session && roles.includes(session.role);
  }

  // ============================================
  // Route Protection
  // ============================================
  function requireAuth() {
    if (!isAuthenticated()) {
      return { 
        allowed: false, 
        redirect: '#/login',
        message: 'Please log in to access this page' 
      };
    }
    return { allowed: true };
  }

  function requireRole(role) {
    const authCheck = requireAuth();
    if (!authCheck.allowed) {
      return authCheck;
    }

    if (!hasRole(role)) {
      return { 
        allowed: false, 
        redirect: '#/',
        message: 'You do not have permission to access this page' 
      };
    }

    return { allowed: true };
  }

  function requireAnyRole(roles) {
    const authCheck = requireAuth();
    if (!authCheck.allowed) {
      return authCheck;
    }

    if (!hasAnyRole(roles)) {
      return { 
        allowed: false, 
        redirect: '#/',
        message: 'You do not have permission to access this page' 
      };
    }

    return { allowed: true };
  }

  // ============================================
  // Public API
  // ============================================
  window.PMTwinAuth = {
    register,
    login,
    logout,
    getCurrentUser,
    getCurrentSession,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    requireAuth,
    requireRole,
    requireAnyRole,
    validateEmail,
    validatePassword,
    generateOTP,
    verifyOTP,
    requestOTP,
    sendOTP,
    canUserLogin
  };

})();


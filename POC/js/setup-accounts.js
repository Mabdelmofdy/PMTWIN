/**
 * PMTwin Test Accounts Setup Script
 * Run this script in browser console to create all test accounts
 * 
 * Usage: Copy and paste this entire file into browser console, or include it in a page
 */

(function() {
  'use strict';

  // Wait for PMTwinData to be available
  function setupAccounts() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not loaded. Please load data.js first.');
      return;
    }

    // Initialize storage
    PMTwinData.init();

    console.log('🚀 Setting up PMTwin test accounts...\n');

    // Check if accounts already exist
    const existingUsers = PMTwinData.Users.getAll();
    const adminExists = existingUsers.some(u => u.email === 'admin@pmtwin.com');
    const individualExists = existingUsers.some(u => u.email === 'individual@pmtwin.com');
    const entityExists = existingUsers.some(u => u.email === 'entity@pmtwin.com');

    let created = 0;
    let skipped = 0;

    // Create Admin Account
    if (!adminExists) {
      const admin = PMTwinData.Users.create({
        email: 'admin@pmtwin.com',
        password: btoa('Admin123'), // Password: Admin123
        role: 'admin',
        profile: {
          name: 'Admin User',
          status: 'approved',
          department: 'Operations',
          permissions: ['vet_users', 'moderate_projects', 'view_reports', 'manage_audit_trail'],
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'system'
        }
      });
      if (admin) {
        console.log('✅ Admin account created: admin@pmtwin.com / Admin123');
        created++;
      }
    } else {
      console.log('⏭️  Admin account already exists');
      skipped++;
    }

    // Create Individual User Account
    if (!individualExists) {
      const individual = PMTwinData.Users.create({
        email: 'individual@pmtwin.com',
        password: btoa('User123'), // Password: User123
        role: 'individual',
        profile: {
          name: 'John Doe',
          professionalTitle: 'Senior Civil Engineer',
          phone: '+966501234567',
          location: {
            city: 'Riyadh',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          },
          skills: ['Project Management', 'Civil Engineering', 'Construction Planning', 'Quality Control'],
          experienceLevel: 'senior',
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'system',
          credentials: [
            {
              type: 'license',
              fileName: 'professional_license.pdf',
              fileSize: 2048000,
              uploadedAt: new Date().toISOString(),
              verified: true
            },
            {
              type: 'cv',
              fileName: 'john_doe_cv.pdf',
              fileSize: 1536000,
              uploadedAt: new Date().toISOString(),
              verified: true
            }
          ]
        }
      });
      if (individual) {
        console.log('✅ Individual account created: individual@pmtwin.com / User123');
        created++;
      }
    } else {
      console.log('⏭️  Individual account already exists');
      skipped++;
    }

    // Create Entity User Account
    if (!entityExists) {
      const entity = PMTwinData.Users.create({
        email: 'entity@pmtwin.com',
        password: btoa('Entity123'), // Password: Entity123
        role: 'entity',
        profile: {
          name: 'ABC Construction Co.',
          companyName: 'ABC Construction Company Ltd.',
          phone: '+966112345678',
          website: 'https://www.abcconstruction.com',
          location: {
            headquarters: {
              city: 'Riyadh',
              region: 'Riyadh Province',
              country: 'Saudi Arabia',
              address: 'King Fahd Road, Building 123'
            }
          },
          commercialRegistration: {
            number: 'CR-1234567890',
            issueDate: '2010-01-01',
            expiryDate: '2025-01-01',
            verified: true
          },
          vatNumber: {
            number: 'VAT-123456789012345',
            verified: true
          },
          services: ['General Contracting', 'Infrastructure Development', 'Project Management'],
          yearsInBusiness: 15,
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'system',
          credentials: [
            {
              type: 'cr',
              fileName: 'commercial_registration.pdf',
              fileSize: 1024000,
              uploadedAt: new Date().toISOString(),
              verified: true
            },
            {
              type: 'vat',
              fileName: 'vat_certificate.pdf',
              fileSize: 512000,
              uploadedAt: new Date().toISOString(),
              verified: true
            }
          ]
        }
      });
      if (entity) {
        console.log('✅ Entity account created: entity@pmtwin.com / Entity123');
        created++;
      }
    } else {
      console.log('⏭️  Entity account already exists');
      skipped++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created} account(s)`);
    console.log(`   Skipped: ${skipped} account(s) (already exist)`);
    console.log('\n📋 Login Credentials:');
    console.log('   Admin Portal:');
    console.log('     Email: admin@pmtwin.com');
    console.log('     Password: Admin123');
    console.log('\n   User Portal (Individual):');
    console.log('     Email: individual@pmtwin.com');
    console.log('     Password: User123');
    console.log('\n   User Portal (Entity):');
    console.log('     Email: entity@pmtwin.com');
    console.log('     Password: Entity123');
    console.log('\n   Mobile App:');
    console.log('     Use individual@pmtwin.com or entity@pmtwin.com');
    console.log('\n✨ Setup complete! You can now login to any portal.');
  }

  // Auto-run if PMTwinData is already loaded
  if (typeof PMTwinData !== 'undefined') {
    setupAccounts();
  } else {
    // Wait for PMTwinData to load
    window.addEventListener('load', function() {
      setTimeout(setupAccounts, 500);
    });
  }

  // Export function for manual execution
  window.setupPMTwinAccounts = setupAccounts;

})();


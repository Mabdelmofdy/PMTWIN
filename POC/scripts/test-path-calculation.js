#!/usr/bin/env node
/**
 * Test path calculation to find the bug
 */

const testPaths = [
  '/POC/pages/auth/login/',
  '/POC/pages/auth/login/index.html',
  '/POC/pages/auth/signup/',
  '/POC/pages/home/',
  '/POC/pages/home/index.html',
  'http://127.0.0.1:5503/POC/pages/auth/login/',
  'http://127.0.0.1:5503/POC/pages/auth/login/index.html'
];

console.log('Testing Path Calculations:\n');

testPaths.forEach(fullPath => {
  // Simulate window.location.pathname (just the pathname part)
  const pathname = fullPath.startsWith('http') 
    ? new URL(fullPath).pathname 
    : fullPath;
  
  const segments = pathname.split('/').filter(p => p && p !== 'POC' && !p.endsWith('.html'));
  const pagesIndex = segments.indexOf('pages');
  const depth = pagesIndex >= 0 ? segments.length - pagesIndex - 1 : 1;
  const basePath = depth > 0 ? '../'.repeat(depth) : '';
  const redirect = basePath + 'home/';
  
  console.log(`Path: ${pathname}`);
  console.log(`  Segments: [${segments.join(', ')}]`);
  console.log(`  Pages Index: ${pagesIndex}`);
  console.log(`  Depth: ${depth}`);
  console.log(`  BasePath: '${basePath}'`);
  console.log(`  Redirect: '${redirect}'`);
  
  // Simulate what the redirect would resolve to
  const currentDir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
  console.log(`  Current Dir: ${currentDir}`);
  console.log(`  Would resolve to: ${currentDir}${redirect}`);
  console.log('');
});

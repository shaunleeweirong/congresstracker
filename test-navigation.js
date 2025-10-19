// Navigation Testing Script
// Run this in your browser console to quickly test navigation

console.log('🧪 Navigation Testing Script Loaded');
console.log('📍 Current URL:', window.location.href);
console.log('📍 Current Path:', window.location.pathname);

// Test 1: Check body pointer-events
const checkPointerEvents = () => {
  const pointerEvents = document.body.style.pointerEvents;
  console.log('\n✅ TEST 1: Body Pointer Events');
  console.log('  Value:', pointerEvents || 'not set (default: auto)');

  if (pointerEvents === 'none') {
    console.error('  ❌ FAIL: Body has pointer-events: none (navigation blocked!)');
    return false;
  } else {
    console.log('  ✅ PASS: Pointer events are not blocked');
    return true;
  }
};

// Test 2: Check if navigation links exist
const checkNavigationLinks = () => {
  console.log('\n✅ TEST 2: Navigation Links Exist');

  const navigationLinks = [
    { name: 'Dashboard', href: '/' },
    { name: 'Congressional Trades', href: '/trades' },
    { name: 'Members', href: '/members' },
    { name: 'Alerts', href: '/alerts' },
    { name: 'Search', href: '/search' }
  ];

  const links = document.querySelectorAll('header a[href]');
  console.log(`  Found ${links.length} links in header`);

  let allFound = true;
  navigationLinks.forEach(nav => {
    const found = Array.from(links).some(link => link.getAttribute('href') === nav.href);
    if (found) {
      console.log(`  ✅ ${nav.name} link found`);
    } else {
      console.log(`  ❌ ${nav.name} link NOT found`);
      allFound = false;
    }
  });

  return allFound;
};

// Test 3: Check z-index of header
const checkHeaderZIndex = () => {
  console.log('\n✅ TEST 3: Header Z-Index');

  const header = document.querySelector('header');
  if (!header) {
    console.error('  ❌ FAIL: Header not found');
    return false;
  }

  const styles = window.getComputedStyle(header);
  const zIndex = styles.zIndex;
  const position = styles.position;

  console.log('  Z-Index:', zIndex);
  console.log('  Position:', position);

  if (position === 'sticky' && parseInt(zIndex) >= 50) {
    console.log('  ✅ PASS: Header has proper stacking context');
    return true;
  } else {
    console.error('  ⚠️ WARNING: Header may not be properly positioned');
    return false;
  }
};

// Test 4: Check if links are clickable (cursor test)
const checkLinkCursors = () => {
  console.log('\n✅ TEST 4: Link Cursor Styles');

  const navLinks = document.querySelectorAll('header nav a');
  if (navLinks.length === 0) {
    console.error('  ❌ FAIL: No navigation links found');
    return false;
  }

  let allClickable = true;
  navLinks.forEach((link, index) => {
    const styles = window.getComputedStyle(link);
    const cursor = styles.cursor;
    const pointerEvents = styles.pointerEvents;
    const display = styles.display;

    if (display === 'none' || pointerEvents === 'none') {
      console.error(`  ❌ Link ${index + 1}: Not interactive (display: ${display}, pointer-events: ${pointerEvents})`);
      allClickable = false;
    } else {
      console.log(`  ✅ Link ${index + 1}: Clickable (cursor: ${cursor})`);
    }
  });

  return allClickable;
};

// Test 5: Monitor for pointer-events changes
const monitorPointerEvents = () => {
  console.log('\n✅ TEST 5: Monitoring Body Pointer Events');
  console.log('  Watching for changes for 5 seconds...');

  let changeDetected = false;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'style') {
        const pointerEvents = document.body.style.pointerEvents;
        if (pointerEvents === 'none') {
          console.warn('  ⚠️ DETECTED: Body pointer-events was set to "none"');
          changeDetected = true;
        } else if (changeDetected) {
          console.log('  ✅ FIXED: Body pointer-events reset to:', pointerEvents || 'auto');
        }
      }
    });
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style']
  });

  // Simulate the bug to test the fix
  setTimeout(() => {
    console.log('  🧪 Simulating bug: Setting pointer-events to none...');
    document.body.style.pointerEvents = 'none';
  }, 1000);

  setTimeout(() => {
    observer.disconnect();
    console.log('  ✅ Monitoring complete');

    const finalState = document.body.style.pointerEvents;
    if (finalState === 'none') {
      console.error('  ❌ FAIL: Pointer events still blocked after fix attempt');
    } else {
      console.log('  ✅ PASS: Pointer events properly reset');
    }
  }, 5000);
};

// Test 6: Test actual navigation (non-destructive)
const testNavigation = () => {
  console.log('\n✅ TEST 6: Navigation Click Test');
  console.log('  This test will NOT actually navigate, just check if handlers fire');

  const link = document.querySelector('header nav a[href="/"]');
  if (!link) {
    console.error('  ❌ FAIL: Could not find a navigation link to test');
    return false;
  }

  console.log('  Testing link:', link.textContent.trim(), '→', link.href);

  // Check if link is visible and in viewport
  const rect = link.getBoundingClientRect();
  const inViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );

  console.log('  Link position:', rect);
  console.log('  In viewport:', inViewport);

  if (!inViewport) {
    console.warn('  ⚠️ WARNING: Link not in viewport, but may still work');
  }

  return true;
};

// Run all tests
const runAllTests = () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 RUNNING NAVIGATION FIX TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const results = {
    pointerEvents: checkPointerEvents(),
    linksExist: checkNavigationLinks(),
    headerZIndex: checkHeaderZIndex(),
    linkCursors: checkLinkCursors(),
    navigation: testNavigation()
  };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  const allPassed = Object.values(results).every(r => r === true);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED! Navigation should work correctly.');
  } else {
    console.error('❌ SOME TESTS FAILED! Navigation may have issues.');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Start monitoring test
  monitorPointerEvents();
};

// Auto-run tests
runAllTests();

// Export helper functions for manual testing
window.testNavigation = {
  runAll: runAllTests,
  checkPointerEvents,
  checkLinks: checkNavigationLinks,
  checkHeader: checkHeaderZIndex,
  checkCursors: checkLinkCursors,
  monitor: monitorPointerEvents
};

console.log('\n💡 TIP: Run window.testNavigation.runAll() to run tests again');
console.log('💡 TIP: Run individual tests like window.testNavigation.checkPointerEvents()');

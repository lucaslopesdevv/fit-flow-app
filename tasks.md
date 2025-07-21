# Implementation Plan

- [x] 1. Restructure navigation architecture
  - Move content from tab files to dedicated screen files in src/screens/
  - Create InstructorHomeScreen, InstructorStudentsScreen, InstructorNotificationsScreen, InstructorProfileScreen
  - Create StudentHomeScreen, StudentExercisesScreen, StudentNotificationsScreen, StudentProfileScreen
  - Update tab files to import from screen files instead of containing logic directly
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Fix AuthGate and role-based routing
  - Update AuthGate component to handle proper role-based redirects
  - Implement clean navigation logic without mixed tabs
  - Add proper loading and error states for authentication
  - _Requirements: 1.4, 1.5, 4.1, 4.2_

- [x] 3. Create instructor tab layout
  - Implement instructor-specific tab navigation component
  - Configure tabs: Home, Students, Exercises, Notifications, Profile
  - Ensure only instructors can access these tabs
  - _Requirements: 1.1, 1.4_

- [x] 4. Create student tab layout
  - Implement student-specific tab navigation component
  - Configure tabs: Home, Workouts, Exercises, Not
    ifications, Profile
  - Ensure only students can access these tabs
  - _Requirements: 1.2, 1.4_

- [x] 5. Implement student service layer
  - Create StudentService class with methods for student management
  - Implement inviteStudent, getInstructorStudents, updateStudent methods
  - Add proper error handling and TypeScript types
  - _Requirements: 2.3, 2.6, 3.2, 5.1, 5.4_

- [x] 6. Build student invitation modal
  - Create InviteStudentModal component with form fields
  - Implement form validation for email, name, and phone
  - Add loading states and success/error feedback
  - Integrate with student service for invitation sending
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7_

- [x] 7. Implement student list screen
  - Replace placeholder Students screen with functional component
  - Display list of instructor's students with search/filter
  - Add invite button and empty state handling
  - Implement loading states and error handling
  - _Requirements: 3.1, 3.2, 3.6, 3.7_

- [x] 8. Create student details modal
  - Build StudentDetailsModal for viewing/editing student info
  - Implement edit functionality for student name and phone
  - Add deactivate/reactivate student functionality
  - Include proper form validation and feedback
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 9. Enhance authentication hook
  - Update useAuth hook to handle role changes properly
  - Add methods for refreshing user data and role
  - Improve error handling and session management
  - Fix memory leaks and cleanup listeners properly
  - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [x] 10. Add database integration for student management
  - Implement proper queries for instructor-student relationships
  - Use existing create_student database function for invitations
  - Add queries for student listing, updating, and status management
  - Ensure proper RLS policy compliance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Test and validate complete flow
  - Test instructor login and navigation to correct tabs
  - Test student invitation flow end-to-end
  - Verify student management operations work correctly
  - Test role-based access control and navigation
  - _Requirements: 1.1, 1.2, 2.3, 2.4, 2.5, 3.1, 4.1_

/**
 * Compute the correct fee to display for an event.
 *
 * Important: There are 2 fee concepts in the app:
 * - Event fee (event.eventFee / event.fees) — used in some flows
 * - Student registration/participation fee (event.studentFeeEnabled + event.studentFeeAmount)
 *   which applies for admin-created events and should be what students see when enabled.
 */
export function getEventFeeInfo(event, userRole) {
  const role = String(userRole || '').toUpperCase();
  const isStudent = role === 'STUDENT';

  const studentFeeAmount = Number(event?.studentFeeAmount || 0);
  const hasStudentFee =
    isStudent &&
    !!event?.createdByAdmin &&
    !!event?.studentFeeEnabled &&
    studentFeeAmount > 0;

  // Some endpoints expose `fees`; others use `eventFee`.
  const eventFeeAmount = Number(event?.fees ?? event?.eventFee ?? 0);

  const amount = hasStudentFee ? studentFeeAmount : eventFeeAmount;
  const isFree = !(Number.isFinite(amount) && amount > 0);

  return {
    amount: isFree ? 0 : amount,
    isFree,
    // When studentFee applies, this is actually a registration/participation fee for students.
    kind: hasStudentFee ? 'STUDENT_REGISTRATION' : 'EVENT',
    label: isFree ? 'Free' : `₹${amount}`
  };
}



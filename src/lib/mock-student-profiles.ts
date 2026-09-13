import type { StudentProfile } from "@/types/student";

/**
 * Mock profile detail, keyed by the same `id` used in StudentsListView's
 * MOCK_STUDENTS (the two arrays deliberately share id/studentId/name/
 * className/gender/guardianName/phone/status/email so a "View" click from
 * the Students list lands on a profile describing the same student).
 *
 * Only Aisha Bello's ("1") data is verified against the "Student Profile -
 * Overview (Desktop)" Stitch screen — every field below for her matches
 * that screen exactly. The other three (Chidi Okoro, Fatima Yusuf, Tunde
 * Adeyemi) don't have a designed profile screen yet, so their extra detail
 * (attendance/finance/academic figures, guardian relationship/email,
 * activity feed) is plausible placeholder data in the same shape, invented
 * to keep "View" functional for every row rather than left to design-verify
 * later — same spirit as the inferred email domain in MOCK_STUDENTS.
 */
export const MOCK_STUDENT_PROFILES: Record<string, StudentProfile> = {
  "1": {
    id: "1",
    studentId: "EDU-00124",
    name: "Aisha Bello",
    email: "aisha.b@albarka.edu.ng",
    className: "SS 2A",
    gender: "Female",
    guardianName: "Musa Bello",
    phone: "+234 802 344 5566",
    status: "active",
    dateOfBirth: "12 May 2008",
    admissionDate: "15 Sept 2021",
    academicSession: "2023/2024",
    guardianRelationship: "Father",
    guardianEmail: "musa.bello@email.com",
    attendance: { percent: 94, present: 142, absent: 6, late: 3 },
    finance: { status: "Fully Paid", totalFee: "₦450k", paid: "₦450k", balance: "₦0" },
    academicPerformance: { term: "2nd Term", average: 78.4, position: "4th in class" },
    recentActivity: [
      { label: "Fee payment recorded", detail: "2 mins ago" },
      { label: "Attendance marked (Present)", detail: "Today, 8:15 AM" },
      { label: "Result published: Mathematics", detail: "2 days ago" },
    ],
  },
  "2": {
    id: "2",
    studentId: "EDU-00125",
    name: "Chidi Okoro",
    email: "chidi.o@albarka.edu.ng",
    className: "SS 2B",
    gender: "Male",
    guardianName: "Ngozi Okoro",
    phone: "+234 703 111 2233",
    status: "active",
    dateOfBirth: "3 Feb 2008",
    admissionDate: "10 Sept 2021",
    academicSession: "2023/2024",
    guardianRelationship: "Mother",
    guardianEmail: "ngozi.okoro@email.com",
    attendance: { percent: 89, present: 132, absent: 12, late: 7 },
    finance: { status: "Balance Due", totalFee: "₦450k", paid: "₦300k", balance: "₦150k" },
    academicPerformance: { term: "2nd Term", average: 71.2, position: "9th in class" },
    recentActivity: [
      { label: "Attendance marked (Present)", detail: "Today, 8:20 AM" },
      { label: "Result published: Basic Science", detail: "2 days ago" },
    ],
  },
  "3": {
    id: "3",
    studentId: "EDU-00126",
    name: "Fatima Yusuf",
    email: "fatima.y@albarka.edu.ng",
    className: "JSS 3C",
    gender: "Female",
    guardianName: "Ibrahim Yusuf",
    phone: "+234 901 222 3344",
    status: "inactive",
    dateOfBirth: "21 Nov 2010",
    admissionDate: "2 Sept 2022",
    academicSession: "2023/2024",
    guardianRelationship: "Father",
    guardianEmail: "ibrahim.yusuf@email.com",
    attendance: { percent: 62, present: 58, absent: 30, late: 5 },
    finance: { status: "Balance Due", totalFee: "₦380k", paid: "₦200k", balance: "₦180k" },
    academicPerformance: { term: "2nd Term", average: 58.6, position: "22nd in class" },
    recentActivity: [{ label: "Marked inactive", detail: "3 weeks ago" }],
  },
  "4": {
    id: "4",
    studentId: "EDU-00127",
    name: "Tunde Adeyemi",
    email: "tunde.a@albarka.edu.ng",
    className: "SS 3A",
    gender: "Male",
    guardianName: "Bayo Adeyemi",
    phone: "+234 815 444 5555",
    status: "graduated",
    dateOfBirth: "8 Jan 2007",
    admissionDate: "12 Sept 2019",
    academicSession: "2022/2023",
    guardianRelationship: "Father",
    guardianEmail: "bayo.adeyemi@email.com",
    attendance: { percent: 96, present: 168, absent: 4, late: 2 },
    finance: { status: "Fully Paid", totalFee: "₦480k", paid: "₦480k", balance: "₦0" },
    academicPerformance: { term: "3rd Term", average: 84.9, position: "2nd in class" },
    recentActivity: [{ label: "Graduated — SS 3A", detail: "Aug 2026" }],
  },
};
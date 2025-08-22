import community_contributor from "../assets/p5.png";
import first_case_analysed from "../assets/p4.png";
import doctor_approved_insight from "../assets/p3.png";
import top_rated_intern from "../assets/p2.png";
import verified_diagnosis from "../assets/p1.png";
import novice_analyst from "../assets/p8.png";
import proficient_diagnostician from "../assets/p9.png";
import expert_solver from "../assets/p10.png";
import cardiology_explorer from "../assets/p13.png";

export const badges = [
  {
    id: 1,
    name: "Novice Analyst",
    image: novice_analyst,
    unlocked: true,
    tooltip: "Unlocked: Completed your first case analysis.",
  },
  {
    id: 2,
    name: "First Case Analysed",
    image: first_case_analysed,
    unlocked: true,
    tooltip: "Unlocked: Successfully analyzed your first medical case.",
  },
  {
    id: 3,
    name: "Doctor Approved Insight",
    image: doctor_approved_insight,
    unlocked: true,
    tooltip: "Unlocked: Received a 'Doctor Approved' rating on an insight.",
  },
  {
    id: 4,
    name: "Community Contributor",
    image: community_contributor,
    unlocked: true,
    tooltip: "Unlocked: Provided valuable help in community discussions.",
  },
  {
    id: 5,
    name: "Proficient Diagnostician",
    image: proficient_diagnostician,
    unlocked: false,
    tooltip: "Locked: Correctly diagnose 10 complex cases.",
  },
  {
    id: 6,
    name: "Expert Solver",
    image: expert_solver,
    unlocked: false,
    tooltip: "Locked: Solve 25 cases with a 90% accuracy rate.",
  },
  {
    id: 7,
    name: "Cardiology Explorer",
    image: cardiology_explorer,
    unlocked: false,
    tooltip: "Locked: Successfully analyze 5 cardiology-related cases.",
  },
  {
    id: 8,
    name: "Top Rated Intern",
    image: top_rated_intern,
    unlocked: false,
    tooltip: "Locked: Reach the top 10% of interns on the leaderboard.",
  },
  {
    id: 9,
    name: "Verified Diagnosis",
    image: verified_diagnosis,
    unlocked: false,
    tooltip: "Locked: Have 3 of your diagnoses verified by senior doctors.",
  },
];

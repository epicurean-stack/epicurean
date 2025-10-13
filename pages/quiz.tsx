import { useState } from "react";
import ExperienceCard from "../components/ExperienceCard";

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const questions = [
    { key: "mode", question: "Do you want to go out or stay home?", options: ["Out", "Home"] },
    { key: "group", question: "Who are you with?", options: ["Friends", "Family", "WorkCrew"] },
    { key: "budget_pp", question: "What’s your budget per person?", options: [50, 100, 150] },
    { key: "party_size", question: "How many people?", options: [2, 4, 6, 8, 10] },
  ];

  const handleAnswer = (val: any) => {
    setAnswers({ ...answers, [questions[step].key]: val });
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <p>Loading your matches...</p>;

  if (results.length > 0) {
    return (
      <div>
        <h1>Your Recommendations</h1>
        {results.map((exp, i) => (
          <ExperienceCard key={i} exp={exp} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1>Quiz</h1>
      <p>{questions[step].question}</p>
      {questions[step].options.map((opt) => (
        <button key={opt} onClick={() => handleAnswer(opt)} style={{ margin: "5px" }}>
          {opt}
        </button>
      ))}
    </div>
  );
}


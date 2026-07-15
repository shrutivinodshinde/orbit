interface Props {
    role: string;
    onSelect: (prompt: string) => void;
  }
  
  const PROMPTS: Record<string, string[]> = {
    'Super Admin': [
      'What is our total revenue across all countries?',
      'Which branch has the most pending orders?',
      'Are there any shipments stuck in customs right now?',
      'Compare sales performance between India and Germany',
      'How many employees were present today?',
    ],
    'Country Admin': [
      'What is this country\'s total revenue this month?',
      'Show me all pending export shipments',
      'Which branch is performing best?',
      'How many shipments are cleared through customs?',
    ],
    Manager: [
      'What are my branch\'s open sales orders?',
      'How many team members checked in today?',
      'Show me shipments that need attention',
      'What is my branch\'s total completed revenue?',
    ],
    'Team Lead': [
      'What orders are assigned to our team?',
      'Show me today\'s attendance for our team',
      'What shipments are we tracking?',
    ],
  };
  
  const DEFAULT_PROMPTS = [
    'Show me my sales orders',
    'What is my attendance history?',
  ];
  
  export default function SuggestedPrompts({ role, onSelect }: Props) {
    const prompts = PROMPTS[role] ?? DEFAULT_PROMPTS;
  
    return (
      <div className="space-y-3 w-full max-w-xl mx-auto">
        <p className="text-xs text-gray-400 text-center uppercase tracking-wide font-medium">
          Suggested questions
        </p>
        <div className="grid gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelect(prompt)}
              className="text-left text-sm text-gray-700 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 rounded-xl px-4 py-3 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }
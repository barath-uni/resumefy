import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { CheckCircle, Circle, Target } from 'lucide-react'

interface SkillsChecklistProps {
  jobTitle: string
  skills: string[]
}

export function SkillsChecklist({ jobTitle, skills }: SkillsChecklistProps) {
  const [checkedSkills, setCheckedSkills] = useState<Set<string>>(new Set())

  const toggleSkill = (skill: string) => {
    const newChecked = new Set(checkedSkills)
    if (newChecked.has(skill)) {
      newChecked.delete(skill)
    } else {
      newChecked.add(skill)
    }
    setCheckedSkills(newChecked)
  }

  const percentage = Math.round((checkedSkills.size / skills.length) * 100)

  const getProgressColor = () => {
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getFeedback = () => {
    if (percentage >= 70) {
      return 'Excellent! You have most of the key skills employers are looking for.'
    }
    if (percentage >= 40) {
      return 'Good start! Consider highlighting these skills more prominently in your resume.'
    }
    return 'Focus on developing these skills to become more competitive for this role.'
  }

  return (
    <Card className="p-6 my-8 border-2 border-[#ff9f1c]/20 bg-gradient-to-br from-white to-[#ffbf69]/10">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-[#ff9f1c]" />
          <h3 className="text-xl font-heading font-bold text-gray-900">
            Top Skills for {jobTitle}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Check off the skills you have to see how you match up
        </p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Your Match</span>
            <span className="font-bold text-gray-900">
              {checkedSkills.size} / {skills.length} skills
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${getProgressColor()} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 italic">{getFeedback()}</p>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {skills.map((skill) => {
          const isChecked = checkedSkills.has(skill)
          return (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                isChecked
                  ? 'border-[#2ec4b6] bg-[#cbf3f0]/30'
                  : 'border-gray-200 hover:border-[#2ec4b6]/50'
              }`}
            >
              {isChecked ? (
                <CheckCircle className="w-5 h-5 text-[#2ec4b6] flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  isChecked ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {skill}
              </span>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      {checkedSkills.size > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-[#cbf3f0] to-[#ffbf69]/20 rounded-lg">
          <p className="text-sm text-gray-700 mb-3">
            Ready to tailor your resume to highlight these {checkedSkills.size} skills?
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-[#ff9f1c] hover:bg-[#ffbf69] text-white"
          >
            Create Tailored Resume
          </Button>
        </div>
      )}
    </Card>
  )
}

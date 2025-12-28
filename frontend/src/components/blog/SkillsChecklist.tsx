import { useState } from 'react'
import { Button } from '../ui/button'
import { CheckCircle, Circle } from 'lucide-react'
import { motion } from 'framer-motion'

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
    if (percentage >= 70) return 'bg-gradient-to-r from-emerald-500 to-green-600'
    if (percentage >= 40) return 'bg-gradient-to-r from-blue-500 to-indigo-600'
    return 'bg-gradient-to-r from-gray-400 to-gray-500'
  }

  const getFeedback = () => {
    if (percentage >= 70) {
      return '🎉 Excellent! You have most of the key skills employers are looking for.'
    }
    if (percentage >= 40) {
      return '💪 Good start! Consider highlighting these skills more prominently.'
    }
    return '📚 Focus on developing these skills to become more competitive.'
  }

  return (
    <div className="relative group my-12">
      {/* Subtle animated border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>

      <div className="relative bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-sm">
              🎯
            </div>
            <div>
              <h3 className="text-2xl font-heading font-bold text-gray-900">
                Top Skills for {jobTitle}
              </h3>
              <p className="text-sm text-gray-600">
                Check off the skills you have
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3 bg-gray-50 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Your Match</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`${getProgressColor()} h-4 rounded-full shadow-sm`}
              />
            </div>
            <p className="text-sm text-gray-700 font-medium">{getFeedback()}</p>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {skills.map((skill, index) => {
            const isChecked = checkedSkills.has(skill)
            return (
              <motion.button
                key={skill}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleSkill(skill)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isChecked
                    ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                }`}
              >
                {isChecked ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    isChecked ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {skill}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* CTA */}
        {checkedSkills.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 rounded-2xl border border-emerald-200"
          >
            <p className="text-base text-gray-900 mb-4 font-medium">
              ✨ Ready to tailor your resume to highlight these {checkedSkills.size} skills?
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 hover:opacity-90 text-white border-0 shadow-sm py-6"
            >
              Create Tailored Resume →
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

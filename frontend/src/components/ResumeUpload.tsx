import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { uploadResume } from '../lib/uploadResume'

interface ResumeUploadProps {
  userId: string
  onUploadSuccess: (resumeId: string, fileUrl: string) => void
  existingResume?: {
    id: string
    file_name: string
    file_size: number
    created_at: string
  }
}

export default function ResumeUpload({ userId, onUploadSuccess, existingResume }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  console.log('🎨 ResumeUpload rendered', { userId, existingResume })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('📂 onDrop triggered!', { acceptedFiles, filesCount: acceptedFiles.length })

    const file = acceptedFiles[0]
    if (!file) {
      console.log('❌ No file selected')
      return
    }

    console.log('📄 File selected:', { name: file.name, size: file.size, type: file.type })

    setUploadedFile(file)
    setError(null)
    setSuccess(false)
    setUploading(true)

    console.log('🔄 Calling uploadResume function...')

    try {
      const result = await uploadResume(file, userId)

      console.log('📥 Upload result:', result)

      if (result.success && result.resumeId && result.fileUrl) {
        console.log('✅ Upload successful!')
        setSuccess(true)
        onUploadSuccess(result.resumeId, result.fileUrl)
      } else {
        console.error('❌ Upload failed:', result.error)
        setError(result.error || 'Upload failed')
      }
    } catch (err) {
      console.error('❌ Upload exception:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setUploading(false)
      console.log('🏁 Upload process complete')
    }
  }, [userId, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {/* Existing Resume Display */}
      {existingResume && !uploadedFile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{existingResume.file_name}</div>
              <div className="text-sm text-gray-600">
                {formatFileSize(existingResume.file_size)} • Uploaded {new Date(existingResume.created_at).toLocaleDateString()}
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          </div>
        </motion.div>
      )}

      {/* Dropzone */}
      <AnimatePresence mode="wait">
        {!success && !existingResume && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
                ${isDragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-emerald-400 bg-white'
                }
                ${uploading ? 'pointer-events-none opacity-75' : ''}
              `}
            >
              <input {...getInputProps()} />

            <div className="text-center">
              <motion.div
                animate={{
                  scale: isDragActive ? 1.1 : 1,
                  rotate: isDragActive ? 5 : 0
                }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-white" />
                )}
              </motion.div>

              {uploading ? (
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">Uploading...</p>
                  <p className="text-sm text-gray-600">Please wait while we upload your resume</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF or DOCX • Max 5MB
                  </p>
                </div>
              )}
            </div>
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {success && uploadedFile && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate mb-1">{uploadedFile.name}</div>
                <div className="text-sm text-gray-600 mb-3">
                  {formatFileSize(uploadedFile.size)} • Just now
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Upload successful!</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null)
                  setSuccess(false)
                }}
                className="p-1 hover:bg-emerald-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replace Resume Button (when existing resume) */}
      {existingResume && !uploadedFile && (
        <Button
          {...getRootProps()}
          variant="outline"
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={uploading}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Replace Resume
            </>
          )}
        </Button>
      )}
    </div>
  )
}

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface ContentBlock {
  id: string
  type: 'header' | 'section' | 'list' | 'text'
  category: 'contact' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'custom' | 'summary'
  priority: number
  content: any
  metadata: {
    estimatedLines: number
    isOptional: boolean
    keywords: string[]
  }
}

interface LayoutDecision {
  templateName: string
  placement: {
    [blockId: string]: {
      section: 'main' | 'sidebar' | 'header'
      order: number
      fontSize: number
      maxLines?: number
    }
  }
  fits: boolean
  overflow: {
    hasOverflow: boolean
    overflowLines: number
    recommendations: string[]
  }
  warnings: string[]
}

interface TemplateDProps {
  blocks: ContentBlock[]
  layout: LayoutDecision
}

// Template D: Compact Dense Layout
// Ultra-efficient use of space for senior professionals
// Two-column main content, compact headers, multi-column skills
// Perfect for content-heavy resumes

const createStyles = (_layout: LayoutDecision) => {
  return StyleSheet.create({
    page: {
      padding: 28,
      fontFamily: 'Helvetica',
      fontSize: 9,
      lineHeight: 1.3,
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
    },
    // Compact header
    header: {
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: '2px solid #000000',
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#000000',
      letterSpacing: 0.8,
    },
    jobTitle: {
      fontSize: 11,
      color: '#333333',
      marginBottom: 4,
      fontFamily: 'Helvetica-Oblique',
    },
    contactInfo: {
      fontSize: 8,
      color: '#555555',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    contactItem: {
      marginRight: 10,
    },
    contactSeparator: {
      marginHorizontal: 4,
      color: '#999999',
    },
    // Main content
    main: {
      flex: 1,
    },
    // Compact section headers
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginTop: 10,
      marginBottom: 5,
      color: '#000000',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      backgroundColor: '#f0f0f0',
      padding: 3,
      paddingLeft: 6,
    },
    // Summary section
    summary: {
      fontSize: 9,
      lineHeight: 1.4,
      marginBottom: 4,
      color: '#2a2a2a',
      textAlign: 'justify',
    },
    // Two-column layout for experience
    twoColumnContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    column: {
      flex: 1,
    },
    // Experience entries - ultra compact
    experienceEntry: {
      marginBottom: 7,
    },
    positionLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
    },
    position: {
      fontSize: 9.5,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      flex: 1,
    },
    dates: {
      fontSize: 8,
      color: '#666666',
      fontFamily: 'Helvetica-Oblique',
    },
    company: {
      fontSize: 9,
      fontFamily: 'Helvetica-Oblique',
      marginBottom: 2,
      color: '#444444',
    },
    bulletList: {
      paddingLeft: 10,
    },
    bullet: {
      fontSize: 8.5,
      marginBottom: 1.5,
      flexDirection: 'row',
      color: '#2a2a2a',
    },
    bulletSymbol: {
      marginRight: 4,
      fontSize: 7,
    },
    // Multi-column skills grid
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 3,
      marginTop: 3,
    },
    skillItem: {
      fontSize: 8,
      backgroundColor: '#f5f5f5',
      padding: '2px 6px',
      borderRadius: 2,
      border: '0.5px solid #d0d0d0',
      color: '#2a2a2a',
      width: '23%',
      textAlign: 'center',
    },
    // Compact education
    educationContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    educationEntry: {
      marginBottom: 5,
      width: '48%',
    },
    degree: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 1,
      color: '#000000',
    },
    school: {
      fontSize: 8.5,
      marginBottom: 0.5,
      color: '#444444',
    },
    year: {
      fontSize: 8,
      color: '#666666',
    },
    // Projects - compact
    projectEntry: {
      marginBottom: 6,
    },
    projectTitle: {
      fontSize: 9.5,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 1,
      color: '#000000',
    },
    projectDescription: {
      fontSize: 8.5,
      lineHeight: 1.3,
      marginBottom: 2,
      color: '#2a2a2a',
    },
    techStack: {
      fontSize: 8,
      color: '#666666',
      fontFamily: 'Helvetica-Oblique',
    },
    // Certifications - inline
    certContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    certEntry: {
      marginBottom: 4,
      width: '48%',
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 1,
      color: '#000000',
    },
    certIssuer: {
      fontSize: 8,
      color: '#444444',
    },
    certDate: {
      fontSize: 7.5,
      color: '#666666',
    },
  })
}

const TemplateD: React.FC<TemplateDProps> = ({ blocks, layout }) => {
  const styles = createStyles(layout)

  // Sort blocks by placement order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = layout.placement[a.id]?.order ?? 999
    const orderB = layout.placement[b.id]?.order ?? 999
    return orderA - orderB
  })

  // Find contact block for header
  const contactBlock = blocks.find(b => b.category === 'contact')

  // Group blocks by category
  const summaryBlocks = sortedBlocks.filter(b => b.category === 'summary')
  const experienceBlocks = sortedBlocks.filter(b => b.category === 'experience')
  const educationBlocks = sortedBlocks.filter(b => b.category === 'education')
  const skillsBlocks = sortedBlocks.filter(b => b.category === 'skills')
  const projectBlocks = sortedBlocks.filter(b => b.category === 'projects')
  const certBlocks = sortedBlocks.filter(b => b.category === 'certifications')

  // Split experience into two columns if there are many entries
  const midpoint = Math.ceil(experienceBlocks.length / 2)
  const experienceCol1 = experienceBlocks.slice(0, midpoint)
  const experienceCol2 = experienceBlocks.slice(midpoint)

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.name}>{contactBlock?.content.name || 'Your Name'}</Text>
      {contactBlock?.content.title && (
        <Text style={styles.jobTitle}>{contactBlock.content.title}</Text>
      )}
      <View style={styles.contactInfo}>
        {contactBlock?.content.email && (
          <Text style={styles.contactItem}>{contactBlock.content.email}</Text>
        )}
        {contactBlock?.content.phone && (
          <>
            <Text style={styles.contactSeparator}>|</Text>
            <Text style={styles.contactItem}>{contactBlock.content.phone}</Text>
          </>
        )}
        {contactBlock?.content.location && (
          <>
            <Text style={styles.contactSeparator}>|</Text>
            <Text style={styles.contactItem}>{contactBlock.content.location}</Text>
          </>
        )}
        {contactBlock?.content.linkedin && (
          <>
            <Text style={styles.contactSeparator}>|</Text>
            <Text style={styles.contactItem}>{contactBlock.content.linkedin}</Text>
          </>
        )}
        {contactBlock?.content.github && (
          <>
            <Text style={styles.contactSeparator}>|</Text>
            <Text style={styles.contactItem}>{contactBlock.content.github}</Text>
          </>
        )}
      </View>
    </View>
  )

  // Render summary
  const renderSummary = (block: ContentBlock) => (
    <View key={block.id}>
      <Text style={styles.sectionTitle}>Professional Summary</Text>
      <Text style={styles.summary}>{block.content?.text || block.content}</Text>
    </View>
  )

  // Render experience entry
  const renderExperience = (block: ContentBlock) => (
    <View key={block.id} style={styles.experienceEntry}>
      <View style={styles.positionLine}>
        <Text style={styles.position}>{block.content.title || block.content.position}</Text>
        {(block.content.startDate || block.content.endDate) && (
          <Text style={styles.dates}>
            {block.content.startDate || ''}{block.content.startDate && block.content.endDate && ' - '}{block.content.endDate || ''}
          </Text>
        )}
      </View>
      <Text style={styles.company}>{block.content.company}</Text>
      {block.content.bullets && Array.isArray(block.content.bullets) && (
        <View style={styles.bulletList}>
          {block.content.bullets.map((bullet: string, idx: number) => (
            <View key={idx} style={styles.bullet}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text>{bullet}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )

  // Render education
  const renderEducation = (block: ContentBlock) => {
    const entries = Array.isArray(block.content) ? block.content : [block.content]
    return entries.map((entry: any, idx: number) => (
      <View key={`${block.id}-${idx}`} style={styles.educationEntry}>
        <Text style={styles.degree}>{entry.degree}</Text>
        <Text style={styles.school}>{entry.school || entry.institution}</Text>
        {entry.year && <Text style={styles.year}>{entry.year}</Text>}
      </View>
    ))
  }

  // Render skills
  const renderSkills = (block: ContentBlock) => {
    const skills = Array.isArray(block.content) ? block.content :
                   (block.content?.items ? (Array.isArray(block.content.items) ? block.content.items : []) : [])

    return (
      <View key={block.id} style={styles.skillsGrid}>
        {skills.map((skill: string, idx: number) => (
          <Text key={idx} style={styles.skillItem}>{skill}</Text>
        ))}
      </View>
    )
  }

  // Render project
  const renderProject = (block: ContentBlock) => (
    <View key={block.id} style={styles.projectEntry}>
      <Text style={styles.projectTitle}>{block.content.title || block.content.name}</Text>
      {block.content.description && (
        <Text style={styles.projectDescription}>{block.content.description}</Text>
      )}
      {block.content.bullets && Array.isArray(block.content.bullets) && (
        <View style={styles.bulletList}>
          {block.content.bullets.map((bullet: string, idx: number) => (
            <View key={idx} style={styles.bullet}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text>{bullet}</Text>
            </View>
          ))}
        </View>
      )}
      {block.content.technologies && (
        <Text style={styles.techStack}>
          {Array.isArray(block.content.technologies) ? block.content.technologies.join(' • ') : block.content.technologies}
        </Text>
      )}
    </View>
  )

  // Render certifications
  const renderCert = (block: ContentBlock) => {
    const certs = Array.isArray(block.content) ? block.content : [block.content]
    return certs.map((cert: any, idx: number) => (
      <View key={`${block.id}-${idx}`} style={styles.certEntry}>
        <Text style={styles.certName}>{cert.name || cert.title}</Text>
        {cert.issuer && <Text style={styles.certIssuer}>{cert.issuer}</Text>}
        {cert.date && <Text style={styles.certDate}>{cert.date}</Text>}
      </View>
    ))
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Compact Header */}
        {renderHeader()}

        {/* Main Content */}
        <View style={styles.main}>
          {/* Summary */}
          {summaryBlocks.map(block => renderSummary(block))}

          {/* Skills - Multi-column grid */}
          {skillsBlocks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Core Skills</Text>
              {skillsBlocks.map(block => renderSkills(block))}
            </View>
          )}

          {/* Experience - Two columns if many entries */}
          {experienceBlocks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Professional Experience</Text>
              {experienceBlocks.length > 3 ? (
                <View style={styles.twoColumnContainer}>
                  <View style={styles.column}>
                    {experienceCol1.map(block => renderExperience(block))}
                  </View>
                  <View style={styles.column}>
                    {experienceCol2.map(block => renderExperience(block))}
                  </View>
                </View>
              ) : (
                experienceBlocks.map(block => renderExperience(block))
              )}
            </View>
          )}

          {/* Education - Two columns */}
          {educationBlocks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Education</Text>
              <View style={styles.educationContainer}>
                {educationBlocks.map(block => renderEducation(block))}
              </View>
            </View>
          )}

          {/* Projects */}
          {projectBlocks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projectBlocks.map(block => renderProject(block))}
            </View>
          )}

          {/* Certifications - Two columns */}
          {certBlocks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <View style={styles.certContainer}>
                {certBlocks.map(block => renderCert(block))}
              </View>
            </View>
          )}
        </View>

        {/* Footer - Add warnings if any */}
        {layout.warnings.length > 0 && (
          <View style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid #e0e0e0' }}>
            <Text style={{ fontSize: 7, color: '#999999' }}>
              Note: {layout.warnings.join(', ')}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

export default TemplateD

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

interface TemplateCProps {
  blocks: ContentBlock[]
  layout: LayoutDecision
}

// Template C: Creative Bold Layout with Timeline & Color Zones
// Color palette from CLAUDE.md:
// - buff (#d4a373) for primary accents & timeline markers
// - tea-green (#ccd5ae) for section backgrounds
// - beige (#e9edc9) for skill tags
// - cornsilk (#fefae0) for page background

const createStyles = (_layout: LayoutDecision) => {
  return StyleSheet.create({
    page: {
      padding: 0,
      fontFamily: 'Helvetica',
      fontSize: 10.5,
      lineHeight: 1.5,
      color: '#2d3748',
      backgroundColor: '#fefae0', // cornsilk background
    },
    // Bold header with color bar and geometric elements
    header: {
      backgroundColor: '#d4a373', // buff color
      padding: 32,
      marginBottom: 0,
      position: 'relative',
    },
    headerAccent: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 120,
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    name: {
      fontSize: 34,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 5,
      color: '#ffffff',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    jobTitle: {
      fontSize: 15,
      color: '#ffffff',
      marginBottom: 12,
      opacity: 0.95,
      fontFamily: 'Helvetica-Oblique',
    },
    contactInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },
    contactItem: {
      fontSize: 9.5,
      color: '#ffffff',
      marginRight: 18,
      opacity: 0.92,
    },
    // Main content area
    main: {
      padding: 32,
    },
    sectionContainer: {
      marginBottom: 22,
    },
    sectionHeader: {
      backgroundColor: '#ccd5ae', // tea-green
      padding: 10,
      marginBottom: 14,
      borderRadius: 0,
      borderLeft: '6px solid #d4a373',
      position: 'relative',
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#1a202c',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      paddingLeft: 8,
    },
    // Timeline elements for experience
    timelineContainer: {
      position: 'relative',
      paddingLeft: 28,
      borderLeft: '3px solid #d4a373',
      marginLeft: 8,
    },
    timelineMarker: {
      position: 'absolute',
      left: -8,
      top: 5,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#d4a373',
      border: '3px solid #fefae0',
    },
    // Summary section
    summary: {
      fontSize: 11,
      lineHeight: 1.6,
      marginBottom: 6,
      color: '#4A5568',
      paddingHorizontal: 4,
    },
    // Experience entries with timeline styling
    experienceEntry: {
      marginBottom: 16,
      paddingLeft: 8,
      position: 'relative',
    },
    position: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 3,
      color: '#1a202c',
    },
    companyLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      backgroundColor: '#e9edc9',
      padding: 4,
      borderRadius: 3,
    },
    company: {
      fontSize: 10.5,
      fontFamily: 'Helvetica-Bold',
      color: '#d4a373', // buff accent
      marginRight: 10,
    },
    dates: {
      fontSize: 9,
      color: '#4a5568',
      fontFamily: 'Helvetica-Oblique',
    },
    bulletList: {
      paddingLeft: 16,
      marginTop: 6,
    },
    bullet: {
      fontSize: 9.5,
      marginBottom: 3.5,
      flexDirection: 'row',
      color: '#4a5568',
    },
    bulletSymbol: {
      marginRight: 8,
      color: '#d4a373', // buff accent
      fontFamily: 'Helvetica-Bold',
      fontSize: 11,
    },
    // Skills section with visual badges
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    skillTag: {
      backgroundColor: '#e9edc9', // beige
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      fontSize: 9.5,
      color: '#2d3748',
      fontFamily: 'Helvetica-Bold',
      border: '2px solid #d4a373',
    },
    // Education entries
    educationEntry: {
      marginBottom: 12,
      paddingLeft: 4,
    },
    degree: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#1A202C',
    },
    school: {
      fontSize: 10,
      marginBottom: 2,
      color: '#4A5568',
    },
    year: {
      fontSize: 9,
      color: '#718096',
    },
    // Projects
    projectEntry: {
      marginBottom: 14,
      paddingLeft: 4,
    },
    projectTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 3,
      color: '#1A202C',
    },
    projectDescription: {
      fontSize: 10,
      lineHeight: 1.5,
      marginBottom: 5,
      color: '#4A5568',
    },
    techStack: {
      fontSize: 9,
      color: '#718096',
      fontFamily: 'Helvetica-Oblique',
    },
    // Certifications
    certEntry: {
      marginBottom: 12,
      paddingLeft: 4,
    },
    certName: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#1A202C',
    },
    certIssuer: {
      fontSize: 10,
      color: '#4A5568',
    },
    certDate: {
      fontSize: 9,
      color: '#718096',
    },
  })
}

const TemplateC: React.FC<TemplateCProps> = ({ blocks, layout }) => {
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

  // Render summary
  const renderSummary = (block: ContentBlock) => (
    <View key={block.id} style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
      </View>
      <Text style={styles.summary}>{block.content?.text || block.content}</Text>
    </View>
  )

  // Render experience with timeline markers
  const renderExperience = (block: ContentBlock) => (
    <View key={block.id} style={styles.experienceEntry}>
      <View style={styles.timelineMarker} />
      <Text style={styles.position}>{block.content.title || block.content.position}</Text>
      <View style={styles.companyLine}>
        <Text style={styles.company}>{block.content.company}</Text>
        {(block.content.startDate || block.content.endDate) && (
          <Text style={styles.dates}>
            {block.content.startDate || ''} {block.content.startDate && block.content.endDate && '→ '}{block.content.endDate || ''}
          </Text>
        )}
      </View>
      {block.content.bullets && Array.isArray(block.content.bullets) && (
        <View style={styles.bulletList}>
          {block.content.bullets.map((bullet: string, idx: number) => (
            <View key={idx} style={styles.bullet}>
              <Text style={styles.bulletSymbol}>▸</Text>
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
      <View key={block.id} style={styles.skillsContainer}>
        {skills.map((skill: string, idx: number) => (
          <Text key={idx} style={styles.skillTag}>{skill}</Text>
        ))}
      </View>
    )
  }

  // Render projects
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
              <Text style={styles.bulletSymbol}>●</Text>
              <Text>{bullet}</Text>
            </View>
          ))}
        </View>
      )}
      {block.content.technologies && (
        <Text style={styles.techStack}>
          Technologies: {Array.isArray(block.content.technologies) ? block.content.technologies.join(', ') : block.content.technologies}
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
        {/* Bold Header with Color */}
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
              <Text style={styles.contactItem}>{contactBlock.content.phone}</Text>
            )}
            {contactBlock?.content.location && (
              <Text style={styles.contactItem}>{contactBlock.content.location}</Text>
            )}
            {contactBlock?.content.linkedin && (
              <Text style={styles.contactItem}>{contactBlock.content.linkedin}</Text>
            )}
            {contactBlock?.content.github && (
              <Text style={styles.contactItem}>{contactBlock.content.github}</Text>
            )}
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {/* Summary */}
          {summaryBlocks.map(block => renderSummary(block))}

          {/* Skills */}
          {skillsBlocks.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Skills</Text>
              </View>
              {skillsBlocks.map(block => renderSkills(block))}
            </View>
          )}

          {/* Experience with Timeline */}
          {experienceBlocks.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Experience</Text>
              </View>
              <View style={styles.timelineContainer}>
                {experienceBlocks.map(block => renderExperience(block))}
              </View>
            </View>
          )}

          {/* Projects */}
          {projectBlocks.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Projects</Text>
              </View>
              {projectBlocks.map(block => renderProject(block))}
            </View>
          )}

          {/* Education */}
          {educationBlocks.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Education</Text>
              </View>
              {educationBlocks.map(block => renderEducation(block))}
            </View>
          )}

          {/* Certifications */}
          {certBlocks.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Certifications</Text>
              </View>
              {certBlocks.map(block => renderCert(block))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export default TemplateC

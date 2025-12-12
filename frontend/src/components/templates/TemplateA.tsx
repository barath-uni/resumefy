import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface ContentBlock {
  id: string
  type: 'header' | 'section' | 'list' | 'text'
  category: 'contact' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'custom'
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

interface TemplateAProps {
  blocks: ContentBlock[]
  layout: LayoutDecision
}

// Register fonts (optional - React-PDF comes with Helvetica by default)
// For production, you might want to register custom fonts here

// Define styles based on Template A constraints - Classic Professional
const createStyles = (_layout: LayoutDecision) => {
  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Helvetica',
      fontSize: 10.5,
      lineHeight: 1.4,
      color: '#1a1a1a',
    },
    header: {
      marginBottom: 20,
      borderBottom: '3px solid #000000',
      paddingBottom: 10,
    },
    name: {
      fontSize: 26,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 3,
      color: '#000000',
      letterSpacing: 0.5,
    },
    contactInfo: {
      fontSize: 9,
      color: '#4a4a4a',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    contactItem: {
      marginRight: 15,
    },
    main: {
      flex: 1,
    },
    sectionDivider: {
      borderTop: '1px solid #d0d0d0',
      marginTop: 14,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 8,
      color: '#000000',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    experienceEntry: {
      marginBottom: 10,
    },
    jobTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#000000',
    },
    company: {
      fontSize: 10,
      fontFamily: 'Helvetica-Oblique',
      marginBottom: 2,
      color: '#4a4a4a',
    },
    dates: {
      fontSize: 9,
      color: '#666666',
      marginBottom: 4,
    },
    bulletList: {
      paddingLeft: 14,
    },
    bullet: {
      fontSize: 9.5,
      marginBottom: 2.5,
      display: 'flex',
      flexDirection: 'row',
      color: '#2a2a2a',
    },
    bulletSymbol: {
      marginRight: 6,
      color: '#000000',
    },
    skillsGrid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 6,
    },
    skillItem: {
      fontSize: 9,
      backgroundColor: '#f8f8f8',
      padding: '4px 10px',
      borderRadius: 2,
      border: '1px solid #e0e0e0',
      color: '#2a2a2a',
      width: '30%',
      textAlign: 'center',
    },
    educationEntry: {
      marginBottom: 8,
    },
    degree: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#000000',
    },
    school: {
      fontSize: 10,
      marginBottom: 1,
      color: '#4a4a4a',
    },
    year: {
      fontSize: 9,
      color: '#666666',
    },
    textBlock: {
      fontSize: 10,
      lineHeight: 1.5,
      marginBottom: 6,
      color: '#2a2a2a',
      textAlign: 'justify',
    },
  })
}

const TemplateA: React.FC<TemplateAProps> = ({ blocks, layout }) => {
  const styles = createStyles(layout)

  // Sort blocks by placement order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = layout.placement[a.id]?.order ?? 999
    const orderB = layout.placement[b.id]?.order ?? 999
    return orderA - orderB
  })

  // Separate blocks by section
  const headerBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'header')
  const mainBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'main')

  // Render header block (name + contact)
  const renderHeaderBlock = (block: ContentBlock) => {
    if (block.category === 'contact' && block.type === 'header') {
      return (
        <View key={block.id} style={styles.header}>
          <Text style={styles.name}>{block.content.name || 'Your Name'}</Text>
          <View style={styles.contactInfo}>
            {block.content.email && (
              <Text style={styles.contactItem}>{block.content.email}</Text>
            )}
            {block.content.phone && (
              <Text style={styles.contactItem}>{block.content.phone}</Text>
            )}
            {block.content.location && (
              <Text style={styles.contactItem}>{block.content.location}</Text>
            )}
            {block.content.linkedin && (
              <Text style={styles.contactItem}>{block.content.linkedin}</Text>
            )}
          </View>
        </View>
      )
    }
    return null
  }

  // Render experience block
  const renderExperienceBlock = (block: ContentBlock) => {
    if (block.category === 'experience' && block.type === 'section') {
      return (
        <View key={block.id}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {Array.isArray(block.content) && block.content.map((entry: any, idx: number) => (
            <View key={idx} style={styles.experienceEntry}>
              <Text style={styles.jobTitle}>{entry.title || entry.position}</Text>
              <Text style={styles.company}>{entry.company}</Text>
              {entry.dates && <Text style={styles.dates}>{entry.dates}</Text>}
              {entry.bullets && Array.isArray(entry.bullets) && (
                <View style={styles.bulletList}>
                  {entry.bullets.map((bullet: string, bIdx: number) => (
                    <View key={bIdx} style={styles.bullet}>
                      <Text style={styles.bulletSymbol}>•</Text>
                      <Text>{bullet}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )
    }
    return null
  }

  // Render education block
  const renderEducationBlock = (block: ContentBlock) => {
    if (block.category === 'education' && block.type === 'section') {
      return (
        <View key={block.id}>
          <Text style={styles.sectionTitle}>Education</Text>
          {Array.isArray(block.content) && block.content.map((entry: any, idx: number) => (
            <View key={idx} style={styles.educationEntry}>
              <Text style={styles.degree}>{entry.degree}</Text>
              <Text style={styles.school}>{entry.school || entry.institution}</Text>
              {entry.year && <Text style={styles.year}>{entry.year}</Text>}
            </View>
          ))}
        </View>
      )
    }
    return null
  }

  // Render skills block with grid layout
  const renderSkillsBlock = (block: ContentBlock) => {
    if (block.category === 'skills' && block.type === 'list') {
      return (
        <View key={block.id}>
          <Text style={styles.sectionTitle}>Core Competencies</Text>
          <View style={styles.skillsGrid}>
            {Array.isArray(block.content) && block.content.map((skill: string, idx: number) => (
              <Text key={idx} style={styles.skillItem}>{skill}</Text>
            ))}
          </View>
        </View>
      )
    }
    return null
  }

  // Render projects block
  const renderProjectsBlock = (block: ContentBlock) => {
    if (block.category === 'projects' && block.type === 'section') {
      return (
        <View key={block.id}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {Array.isArray(block.content) && block.content.map((project: any, idx: number) => (
            <View key={idx} style={styles.experienceEntry}>
              <Text style={styles.jobTitle}>{project.title || project.name}</Text>
              {project.description && (
                <Text style={styles.textBlock}>{project.description}</Text>
              )}
              {project.technologies && (
                <Text style={styles.dates}>Technologies: {project.technologies.join(', ')}</Text>
              )}
            </View>
          ))}
        </View>
      )
    }
    return null
  }

  // Render certifications block
  const renderCertificationsBlock = (block: ContentBlock) => {
    if (block.category === 'certifications' && block.type === 'section') {
      return (
        <View key={block.id}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {Array.isArray(block.content) && block.content.map((cert: any, idx: number) => (
            <View key={idx} style={styles.educationEntry}>
              <Text style={styles.degree}>{cert.name || cert.title}</Text>
              {cert.issuer && <Text style={styles.school}>{cert.issuer}</Text>}
              {cert.date && <Text style={styles.year}>{cert.date}</Text>}
            </View>
          ))}
        </View>
      )
    }
    return null
  }

  // Render text block (summary, objective, etc.)
  const renderTextBlock = (block: ContentBlock) => {
    if (block.type === 'text') {
      return (
        <View key={block.id}>
          <Text style={styles.sectionTitle}>{block.category.toUpperCase()}</Text>
          <Text style={styles.textBlock}>{block.content}</Text>
        </View>
      )
    }
    return null
  }

  // Generic block renderer
  const renderBlock = (block: ContentBlock) => {
    switch (block.category) {
      case 'contact':
        return null // Already rendered in header
      case 'experience':
        return renderExperienceBlock(block)
      case 'education':
        return renderEducationBlock(block)
      case 'skills':
        return renderSkillsBlock(block)
      case 'projects':
        return renderProjectsBlock(block)
      case 'certifications':
        return renderCertificationsBlock(block)
      case 'custom':
        return renderTextBlock(block)
      default:
        return renderTextBlock(block)
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        {headerBlocks.map(block => renderHeaderBlock(block))}

        {/* Main Section with dividers between major sections */}
        <View style={styles.main}>
          {mainBlocks.map((block, idx) => (
            <React.Fragment key={block.id}>
              {idx > 0 && <View style={styles.sectionDivider} />}
              {renderBlock(block)}
            </React.Fragment>
          ))}
        </View>

        {/* Footer - Add warnings if any */}
        {layout.warnings.length > 0 && (
          <View style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #EEEEEE' }}>
            <Text style={{ fontSize: 8, color: '#999999' }}>
              Note: {layout.warnings.join(', ')}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

export default TemplateA

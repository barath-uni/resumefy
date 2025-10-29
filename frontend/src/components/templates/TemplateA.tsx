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

// Define styles based on Template A constraints
const createStyles = (_layout: LayoutDecision) => {
  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Helvetica',
      fontSize: 11,
      lineHeight: 1.5,
      color: '#333333',
    },
    header: {
      marginBottom: 16,
      borderBottom: '2px solid #333333',
      paddingBottom: 8,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 4,
      color: '#000000',
    },
    contactInfo: {
      fontSize: 10,
      color: '#555555',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    contactItem: {
      marginRight: 12,
    },
    main: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      marginTop: 12,
      marginBottom: 6,
      color: '#000000',
      textTransform: 'uppercase',
      borderBottom: '1px solid #CCCCCC',
      paddingBottom: 2,
    },
    experienceEntry: {
      marginBottom: 8,
    },
    jobTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
    },
    company: {
      fontSize: 10,
      fontFamily: 'Helvetica-Oblique',
      marginBottom: 2,
      color: '#555555',
    },
    dates: {
      fontSize: 9,
      color: '#777777',
      marginBottom: 4,
    },
    bulletList: {
      paddingLeft: 16,
    },
    bullet: {
      fontSize: 10,
      marginBottom: 3,
      display: 'flex',
      flexDirection: 'row',
    },
    bulletSymbol: {
      marginRight: 6,
    },
    skillsList: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    skillItem: {
      fontSize: 10,
      backgroundColor: '#F5F5F5',
      padding: '3px 8px',
      borderRadius: 3,
    },
    educationEntry: {
      marginBottom: 6,
    },
    degree: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
    },
    school: {
      fontSize: 10,
      marginBottom: 1,
    },
    year: {
      fontSize: 9,
      color: '#777777',
    },
    textBlock: {
      fontSize: 10,
      lineHeight: 1.4,
      marginBottom: 6,
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

  // Render skills block
  const renderSkillsBlock = (block: ContentBlock) => {
    if (block.category === 'skills' && block.type === 'list') {
      return (
        <View key={block.id}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsList}>
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

        {/* Main Section */}
        <View style={styles.main}>
          {mainBlocks.map(block => renderBlock(block))}
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

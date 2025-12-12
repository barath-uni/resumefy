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

interface TemplateBProps {
  blocks: ContentBlock[]
  layout: LayoutDecision
}

// Template B: Modern Two-Column Layout with Sidebar
// Sidebar (35%): Contact, Skills with visual bars, Education, Certifications
// Main (65%): Name, Summary, Experience, Projects

const createStyles = (_layout: LayoutDecision) => {
  return StyleSheet.create({
    page: {
      padding: 0,
      fontFamily: 'Helvetica',
      fontSize: 10,
      lineHeight: 1.4,
      color: '#2d3748',
      flexDirection: 'row', // Two-column layout
    },
    // Sidebar (left column) - visually distinct
    sidebar: {
      width: '35%',
      backgroundColor: '#2d3748',
      padding: 24,
    },
    sidebarSection: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: '1px solid rgba(255,255,255,0.15)',
    },
    sidebarTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 10,
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    contactItem: {
      fontSize: 8.5,
      marginBottom: 6,
      color: '#e2e8f0',
      lineHeight: 1.5,
    },
    skillItemContainer: {
      marginBottom: 8,
    },
    skillName: {
      fontSize: 9,
      marginBottom: 3,
      color: '#e2e8f0',
      fontFamily: 'Helvetica-Bold',
    },
    skillBarBackground: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    skillBarFill: {
      height: 4,
      backgroundColor: '#4299e1',
      borderRadius: 2,
    },
    educationEntry: {
      marginBottom: 12,
    },
    degree: {
      fontSize: 9.5,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#ffffff',
    },
    school: {
      fontSize: 8.5,
      marginBottom: 2,
      color: '#cbd5e0',
    },
    year: {
      fontSize: 8,
      color: '#a0aec0',
    },
    // Main content (right column)
    main: {
      width: '65%',
      padding: 35,
      backgroundColor: '#ffffff',
    },
    header: {
      marginBottom: 24,
      paddingBottom: 14,
      borderBottom: '4px solid #4299e1',
    },
    name: {
      fontSize: 30,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 4,
      color: '#1a202c',
      letterSpacing: 0.5,
    },
    jobTitle: {
      fontSize: 13,
      color: '#4299e1',
      marginBottom: 10,
      fontFamily: 'Helvetica-Oblique',
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      marginTop: 18,
      marginBottom: 10,
      color: '#1a202c',
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingLeft: 12,
      borderLeft: '4px solid #4299e1',
    },
    experienceEntry: {
      marginBottom: 12,
    },
    position: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#2D3748',
    },
    company: {
      fontSize: 10,
      fontFamily: 'Helvetica-Oblique',
      marginBottom: 2,
      color: '#4A5568',
    },
    dates: {
      fontSize: 9,
      color: '#718096',
      marginBottom: 5,
    },
    bulletList: {
      paddingLeft: 12,
    },
    bullet: {
      fontSize: 9,
      marginBottom: 3,
      display: 'flex',
      flexDirection: 'row',
      color: '#4A5568',
    },
    bulletSymbol: {
      marginRight: 6,
      color: '#4299E1',
    },
    summary: {
      fontSize: 10,
      lineHeight: 1.5,
      marginBottom: 4,
      color: '#4A5568',
    },
    certEntry: {
      marginBottom: 12,
    },
    certName: {
      fontSize: 9.5,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#ffffff',
    },
    certIssuer: {
      fontSize: 8.5,
      color: '#cbd5e0',
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    languageName: {
      fontSize: 9,
      color: '#e2e8f0',
    },
    languageLevel: {
      fontSize: 8,
      color: '#a0aec0',
      fontFamily: 'Helvetica-Oblique',
    },
  })
}

const TemplateB: React.FC<TemplateBProps> = ({ blocks, layout }) => {
  const styles = createStyles(layout)

  // Sort blocks by placement order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = layout.placement[a.id]?.order ?? 999
    const orderB = layout.placement[b.id]?.order ?? 999
    return orderA - orderB
  })

  // Separate blocks by section
  const sidebarBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'sidebar')
  const mainBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'main')

  // Find contact block for header
  const contactBlock = blocks.find(b => b.category === 'contact')

  // Render sidebar content
  const renderSidebarBlock = (block: ContentBlock) => {
    // Contact Info
    if (block.category === 'contact') {
      return (
        <View key={block.id} style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>Contact</Text>
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
          {block.content.github && (
            <Text style={styles.contactItem}>{block.content.github}</Text>
          )}
        </View>
      )
    }

    // Skills with visual rating bars
    if (block.category === 'skills') {
      return (
        <View key={block.id} style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>Skills</Text>
          {Array.isArray(block.content) && block.content.map((skill: string, idx: number) => (
            <View key={idx} style={styles.skillItemContainer}>
              <Text style={styles.skillName}>{skill}</Text>
              <View style={styles.skillBarBackground}>
                <View style={[styles.skillBarFill, { width: `${85 + (idx % 3) * 5}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )
    }

    // Education
    if (block.category === 'education') {
      return (
        <View key={block.id} style={styles.sidebarSection}>
          {/* Only show title once */}
          <Text style={styles.sidebarTitle}>Education</Text>
          {Array.isArray(block.content) ? (
            block.content.map((entry: any, idx: number) => (
              <View key={idx} style={styles.educationEntry}>
                <Text style={styles.degree}>{entry.degree}</Text>
                <Text style={styles.school}>{entry.school || entry.institution}</Text>
                {entry.year && <Text style={styles.year}>{entry.year}</Text>}
              </View>
            ))
          ) : (
            <View style={styles.educationEntry}>
              <Text style={styles.degree}>{block.content.degree}</Text>
              <Text style={styles.school}>{block.content.school || block.content.institution}</Text>
              {block.content.year && <Text style={styles.year}>{block.content.year}</Text>}
            </View>
          )}
        </View>
      )
    }

    // Certifications
    if (block.category === 'certifications') {
      return (
        <View key={block.id} style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>Certifications</Text>
          {Array.isArray(block.content) ? (
            block.content.map((cert: any, idx: number) => (
              <View key={idx} style={styles.certEntry}>
                <Text style={styles.certName}>{cert.name || cert.title}</Text>
                {cert.issuer && <Text style={styles.certIssuer}>{cert.issuer}</Text>}
                {cert.date && <Text style={styles.year}>{cert.date}</Text>}
              </View>
            ))
          ) : (
            <View style={styles.certEntry}>
              <Text style={styles.certName}>{block.content.name || block.content.title}</Text>
              {block.content.issuer && <Text style={styles.certIssuer}>{block.content.issuer}</Text>}
              {block.content.date && <Text style={styles.year}>{block.content.date}</Text>}
            </View>
          )}
        </View>
      )
    }

    return null
  }

  // Render main content
  const renderMainBlock = (block: ContentBlock) => {
    // Summary
    if (block.category === 'summary') {
      return (
        <View key={block.id}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summary}>{block.content?.text || block.content}</Text>
        </View>
      )
    }

    // Experience
    if (block.category === 'experience') {
      return (
        <View key={block.id} style={styles.experienceEntry}>
          <Text style={styles.position}>{block.content.title || block.content.position}</Text>
          <Text style={styles.company}>{block.content.company}</Text>
          {(block.content.startDate || block.content.endDate) && (
            <Text style={styles.dates}>
              {block.content.startDate || ''} {block.content.startDate && block.content.endDate && '- '}{block.content.endDate || ''}
            </Text>
          )}
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
    }

    // Projects
    if (block.category === 'projects') {
      return (
        <View key={block.id} style={styles.experienceEntry}>
          <Text style={styles.position}>{block.content.title || block.content.name}</Text>
          {block.content.description && (
            <Text style={styles.summary}>{block.content.description}</Text>
          )}
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
          {block.content.technologies && (
            <Text style={styles.dates}>
              Technologies: {Array.isArray(block.content.technologies) ? block.content.technologies.join(', ') : block.content.technologies}
            </Text>
          )}
        </View>
      )
    }

    return null
  }

  // Group main blocks by category for section titles
  const experienceBlocks = mainBlocks.filter(b => b.category === 'experience')
  const projectBlocks = mainBlocks.filter(b => b.category === 'projects')
  const summaryBlocks = mainBlocks.filter(b => b.category === 'summary')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          {sidebarBlocks.map(block => renderSidebarBlock(block))}
          {/* Always show contact in sidebar if not placed elsewhere */}
          {contactBlock && !sidebarBlocks.find(b => b.id === contactBlock.id) && renderSidebarBlock(contactBlock)}
        </View>

        {/* Right Main Content */}
        <View style={styles.main}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name}>{contactBlock?.content.name || 'Your Name'}</Text>
            {contactBlock?.content.title && (
              <Text style={styles.jobTitle}>{contactBlock.content.title}</Text>
            )}
          </View>

          {/* Summary */}
          {summaryBlocks.map(block => renderMainBlock(block))}

          {/* Experience */}
          {experienceBlocks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Experience</Text>
              {experienceBlocks.map(block => renderMainBlock(block))}
            </View>
          )}

          {/* Projects */}
          {projectBlocks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projectBlocks.map(block => renderMainBlock(block))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export default TemplateB

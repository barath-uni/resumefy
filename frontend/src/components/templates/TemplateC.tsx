import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import {
  extractTextContent,
  getCategoryTitle,
  isArrayContent,
  isExperienceEntry,
  isEducationEntry,
  isProjectEntry,
  isCertificationEntry
} from './templateHelpers'

interface ContentBlock {
  id: string
  category: string  // Generic - any string allowed
  priority: number
  content: any
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

// Template C: Creative Bold Layout
// Color palette from CLAUDE.md:
// - buff (#d4a373ff) for primary accents
// - tea-green (#ccd5aeff) for section backgrounds
// - beige (#e9edc9ff) for skill tags

const createStyles = (_layout: LayoutDecision) => {
  return StyleSheet.create({
    page: {
      padding: 0,
      fontFamily: 'Helvetica',
      fontSize: 11,
      lineHeight: 1.5,
      color: '#2D3748',
      backgroundColor: '#FFFFFF',
    },
    // Bold header with color bar
    header: {
      backgroundColor: '#d4a373', // buff color
      padding: 30,
      marginBottom: 0,
    },
    name: {
      fontSize: 32,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 6,
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    jobTitle: {
      fontSize: 14,
      color: '#FFFFFF',
      marginBottom: 10,
      opacity: 0.95,
    },
    contactInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    contactItem: {
      fontSize: 10,
      color: '#FFFFFF',
      marginRight: 16,
      opacity: 0.9,
    },
    // Main content area
    main: {
      padding: 30,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionHeader: {
      backgroundColor: '#ccd5ae', // tea-green
      padding: 8,
      marginBottom: 12,
      borderRadius: 4,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: 'Helvetica-Bold',
      color: '#2D3748',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    // Summary section
    summary: {
      fontSize: 11,
      lineHeight: 1.6,
      marginBottom: 6,
      color: '#4A5568',
      paddingHorizontal: 4,
    },
    // Experience entries
    experienceEntry: {
      marginBottom: 14,
      paddingLeft: 4,
    },
    position: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 3,
      color: '#1A202C',
    },
    companyLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },
    company: {
      fontSize: 11,
      fontFamily: 'Helvetica-Oblique',
      color: '#d4a373', // buff accent
      marginRight: 8,
    },
    dates: {
      fontSize: 9,
      color: '#718096',
    },
    bulletList: {
      paddingLeft: 16,
      marginTop: 5,
    },
    bullet: {
      fontSize: 10,
      marginBottom: 4,
      flexDirection: 'row',
      color: '#4A5568',
    },
    bulletSymbol: {
      marginRight: 8,
      color: '#d4a373', // buff accent
      fontFamily: 'Helvetica-Bold',
    },
    // Skills section
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 4,
    },
    skillTag: {
      backgroundColor: '#e9edc9', // beige
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      fontSize: 9,
      color: '#2D3748',
      fontFamily: 'Helvetica-Bold',
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

  // Group blocks by category - exclude contact
  const contentBlocks = sortedBlocks.filter(b => b.category !== 'contact')
  const groupedBlocks: { [category: string]: ContentBlock[] } = {}
  contentBlocks.forEach(block => {
    if (!groupedBlocks[block.category]) {
      groupedBlocks[block.category] = []
    }
    groupedBlocks[block.category].push(block)
  })

  // Generic block content renderer
  const renderBlockContent = (block: ContentBlock) => {
    const { content } = block

    // CASE 1: Array of skills (simple string array)
    if (isArrayContent(content) && content.every((item: any) => typeof item === 'string')) {
      return (
        <View style={styles.skillsContainer}>
          {content.map((skill: string, idx: number) => (
            <Text key={idx} style={styles.skillTag}>{skill}</Text>
          ))}
        </View>
      )
    }

    // CASE 2: Array of entries (experience, education, projects, etc.)
    if (isArrayContent(content)) {
      return (
        <>
          {content.map((entry: any, idx: number) => renderEntry(entry))}
        </>
      )
    }

    // CASE 3: Single object entry (experience, education, project, certification)
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      if (isExperienceEntry(content) || isEducationEntry(content) || isProjectEntry(content) || isCertificationEntry(content)) {
        return renderEntry(content)
      }
    }

    // CASE 4: Single text content (summary, etc.)
    const textContent = extractTextContent(content)
    if (textContent) {
      return <Text style={styles.summary}>{textContent}</Text>
    }

    return null
  }

  // Render individual entry
  const renderEntry = (entry: any) => {
    // Experience entry
    if (isExperienceEntry(entry)) {
      return (
        <View style={styles.experienceEntry}>
          <Text style={styles.position}>{entry.title || entry.position}</Text>
          <View style={styles.companyLine}>
            <Text style={styles.company}>{entry.company}</Text>
            {(entry.startDate || entry.endDate || entry.dates) && (
              <Text style={styles.dates}>
                {entry.dates || `${entry.startDate || ''} ${entry.startDate && entry.endDate ? '- ' : ''}${entry.endDate || ''}`}
              </Text>
            )}
          </View>
          {entry.bullets && Array.isArray(entry.bullets) && (
            <View style={styles.bulletList}>
              {entry.bullets.map((bullet: string, idx: number) => (
                <View key={idx} style={styles.bullet}>
                  <Text style={styles.bulletSymbol}>●</Text>
                  <Text>{bullet}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )
    }

    // Project entry
    if (isProjectEntry(entry)) {
      return (
        <View style={styles.projectEntry}>
          <Text style={styles.projectTitle}>{entry.title || entry.name}</Text>
          {entry.description && <Text style={styles.projectDescription}>{entry.description}</Text>}
          {entry.bullets && Array.isArray(entry.bullets) && (
            <View style={styles.bulletList}>
              {entry.bullets.map((bullet: string, idx: number) => (
                <View key={idx} style={styles.bullet}>
                  <Text style={styles.bulletSymbol}>●</Text>
                  <Text>{bullet}</Text>
                </View>
              ))}
            </View>
          )}
          {entry.technologies && (
            <Text style={styles.techStack}>
              Technologies: {Array.isArray(entry.technologies) ? entry.technologies.join(', ') : entry.technologies}
            </Text>
          )}
        </View>
      )
    }

    // Education entry
    if (isEducationEntry(entry)) {
      return (
        <View style={styles.educationEntry}>
          <Text style={styles.degree}>{entry.degree}</Text>
          <Text style={styles.school}>{entry.school || entry.institution}</Text>
          {entry.gpa && <Text style={styles.year}>GPA: {entry.gpa}</Text>}
          {(entry.graduationDate || entry.year) && (
            <Text style={styles.year}>{entry.graduationDate || entry.year}</Text>
          )}
        </View>
      )
    }

    // Certification entry
    if (isCertificationEntry(entry)) {
      return (
        <View style={styles.certEntry}>
          <Text style={styles.certName}>{entry.name || entry.title}</Text>
          {entry.issuer && <Text style={styles.certIssuer}>{entry.issuer}</Text>}
          {entry.date && <Text style={styles.certDate}>{entry.date}</Text>}
        </View>
      )
    }

    // Fallback: text content
    const textContent = extractTextContent(entry)
    if (textContent) {
      return <Text style={styles.summary}>{textContent}</Text>
    }

    return null
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
            {contactBlock?.content.website && (
              <Text style={styles.contactItem}>{contactBlock.content.website}</Text>
            )}
          </View>
        </View>

        {/* Main Content - Render all categories dynamically */}
        <View style={styles.main}>
          {Object.keys(groupedBlocks).map(category => {
            const categoryBlocks = groupedBlocks[category]
            const sectionTitle = getCategoryTitle(category)

            return (
              <View key={category} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                </View>
                {categoryBlocks.map((block, idx) => (
                  <View key={block.id || idx}>
                    {renderBlockContent(block)}
                  </View>
                ))}
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}

export default TemplateC

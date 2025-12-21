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

interface TemplateDProps {
  blocks: ContentBlock[]
  layout: LayoutDecision
}

// Template D: Compact Dense - Ultra-efficient space utilization
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
    header: {
      marginBottom: 10,
      borderBottom: '1.5px solid #2a2a2a',
      paddingBottom: 6,
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 3,
      color: '#000000',
      letterSpacing: 0.5,
    },
    contactInfo: {
      fontSize: 8,
      color: '#444444',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    contactItem: {
      marginRight: 8,
      fontSize: 8,
    },
    main: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginTop: 8,
      marginBottom: 4,
      color: '#000000',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      borderBottom: '1px solid #cccccc',
      paddingBottom: 2,
    },
    experienceEntry: {
      marginBottom: 5,
    },
    jobTitleRow: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
    },
    jobTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    dates: {
      fontSize: 8,
      color: '#666666',
      textAlign: 'right',
    },
    company: {
      fontSize: 9,
      fontFamily: 'Helvetica-Oblique',
      marginBottom: 2,
      color: '#444444',
    },
    bulletList: {
      paddingLeft: 12,
    },
    bullet: {
      fontSize: 9,
      marginBottom: 2,
      display: 'flex',
      flexDirection: 'row',
      lineHeight: 1.3,
    },
    bulletSymbol: {
      marginRight: 4,
      fontSize: 8,
    },
    skillsGrid: {
      display: 'flex',
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
    educationEntry: {
      marginBottom: 4,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    educationLeft: {
      flex: 1,
    },
    degree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 1,
    },
    school: {
      fontSize: 9,
      color: '#444444',
    },
    year: {
      fontSize: 8,
      color: '#666666',
      textAlign: 'right',
    },
    textBlock: {
      fontSize: 9,
      lineHeight: 1.3,
      marginBottom: 4,
      textAlign: 'justify',
    },
    twoColumnContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: 12,
    },
    column: {
      flex: 1,
    },
    projectEntry: {
      marginBottom: 4,
    },
    projectTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 1,
    },
    projectDescription: {
      fontSize: 8,
      lineHeight: 1.3,
      marginBottom: 1,
    },
    projectTech: {
      fontSize: 7,
      color: '#666666',
      fontFamily: 'Helvetica-Oblique',
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

  // Separate blocks by section
  const headerBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'header')
  const mainBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'main')

  // Find contact block for header
  const contactBlock = blocks.find(b => b.category === 'contact')

  // Render header (name + contact info)
  const renderHeader = () => {
    if (!contactBlock) return null

    const { content } = contactBlock

    return (
      <View style={styles.header}>
        <Text style={styles.name}>{content.name || 'Your Name'}</Text>
        <View style={styles.contactInfo}>
          {content.email && <Text style={styles.contactItem}>{content.email}</Text>}
          {content.phone && <Text style={styles.contactItem}>{content.phone}</Text>}
          {content.location && <Text style={styles.contactItem}>{content.location}</Text>}
          {content.linkedin && <Text style={styles.contactItem}>{content.linkedin}</Text>}
          {content.github && <Text style={styles.contactItem}>{content.github}</Text>}
          {content.website && <Text style={styles.contactItem}>{content.website}</Text>}
        </View>
      </View>
    )
  }

  // Render single block content (NO section title - that's handled in grouping)
  const renderBlockContent = (block: ContentBlock) => {
    const { content } = block

    // CASE 1: Array of skills (simple string array)
    if (isArrayContent(content) && content.every((item: any) => typeof item === 'string')) {
      return (
        <View style={styles.skillsGrid}>
          {content.map((skill: string, idx: number) => (
            <Text key={idx} style={styles.skillItem}>{skill}</Text>
          ))}
        </View>
      )
    }

    // CASE 2: Array of entries
    if (isArrayContent(content)) {
      return (
        <>
          {content.map((entry: any, idx: number) => renderEntry(entry, idx))}
        </>
      )
    }

    // CASE 3: Single object entry (experience, education, project, certification)
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      if (isExperienceEntry(content) || isEducationEntry(content) || isProjectEntry(content) || isCertificationEntry(content)) {
        return renderEntry(content, 0)
      }
    }

    // CASE 4: Single text content
    const textContent = extractTextContent(content)
    if (textContent) {
      return <Text style={styles.textBlock}>{textContent}</Text>
    }

    return null
  }

  // Render individual entry (compact format for Template D)
  const renderEntry = (entry: any, idx: number) => {
    // Experience entry (compact format with dates on right)
    if (isExperienceEntry(entry)) {
      return (
        <View key={idx} style={styles.experienceEntry}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle}>{entry.title || entry.position}</Text>
            {(entry.startDate || entry.endDate || entry.dates) && (
              <Text style={styles.dates}>
                {entry.dates || `${entry.startDate || ''} ${entry.startDate && entry.endDate ? '- ' : ''}${entry.endDate || ''}`}
              </Text>
            )}
          </View>
          <Text style={styles.company}>{entry.company}</Text>
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
      )
    }

    // Education entry (inline format with year on right)
    if (isEducationEntry(entry)) {
      return (
        <View key={idx} style={styles.educationEntry}>
          <View style={styles.educationLeft}>
            <Text style={styles.degree}>{entry.degree}</Text>
            <Text style={styles.school}>{entry.school || entry.institution}</Text>
            {entry.gpa && <Text style={styles.school}>GPA: {entry.gpa}</Text>}
          </View>
          {(entry.graduationDate || entry.year) && (
            <Text style={styles.year}>{entry.graduationDate || entry.year}</Text>
          )}
        </View>
      )
    }

    // Project entry (compact)
    if (isProjectEntry(entry)) {
      return (
        <View key={idx} style={styles.projectEntry}>
          <Text style={styles.projectTitle}>{entry.title || entry.name}</Text>
          {entry.description && (
            <Text style={styles.projectDescription}>{entry.description}</Text>
          )}
          {entry.technologies && (
            <Text style={styles.projectTech}>
              Technologies: {Array.isArray(entry.technologies) ? entry.technologies.join(', ') : entry.technologies}
            </Text>
          )}
        </View>
      )
    }

    // Certification entry (inline format like education)
    if (isCertificationEntry(entry)) {
      return (
        <View key={idx} style={styles.educationEntry}>
          <View style={styles.educationLeft}>
            <Text style={styles.degree}>{entry.name || entry.title}</Text>
            {entry.issuer && <Text style={styles.school}>{entry.issuer}</Text>}
          </View>
          {entry.date && <Text style={styles.year}>{entry.date}</Text>}
        </View>
      )
    }

    // Fallback: render as text if possible
    const textContent = extractTextContent(entry)
    if (textContent) {
      return <Text key={idx} style={styles.textBlock}>{textContent}</Text>
    }

    return null
  }

  // Group blocks by category (excluding contact)
  const contentBlocks = mainBlocks.filter(b => b.category !== 'contact')
  const groupedBlocks: { [category: string]: ContentBlock[] } = {}
  contentBlocks.forEach(block => {
    if (!groupedBlocks[block.category]) {
      groupedBlocks[block.category] = []
    }
    groupedBlocks[block.category].push(block)
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        {renderHeader()}

        {/* Main Section */}
        <View style={styles.main}>
          {Object.keys(groupedBlocks).map(category => {
            const categoryBlocks = groupedBlocks[category]
            const sectionTitle = getCategoryTitle(category)

            return (
              <View key={category}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {categoryBlocks.map((block, idx) => (
                  <View key={block.id || idx}>
                    {renderBlockContent(block)}
                  </View>
                ))}
              </View>
            )
          })}
        </View>

        {/* Footer - Add warnings if any */}
        {layout.warnings.length > 0 && (
          <View style={{ marginTop: 'auto', paddingTop: 6, borderTop: '0.5px solid #eeeeee' }}>
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

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

interface TemplateAProps {
  blocks: ContentBlock[]
  layout: LayoutDecision
}

// Define styles for Template A - Classic Professional
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
      marginBottom: 12,
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
    entryContainer: {
      marginBottom: 8,
    },
    entryTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#000000',
    },
    entrySubtitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Oblique',
      marginBottom: 2,
      color: '#4a4a4a',
    },
    entryDetails: {
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
    skillsList: {
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
  // const headerBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'header')
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
        <View style={styles.skillsList}>
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

  // Render individual entry (experience, education, project, certification, etc.)
  const renderEntry = (entry: any, idx: number) => {
    // Experience entry
    if (isExperienceEntry(entry)) {
      return (
        <View key={idx} style={styles.entryContainer}>
          <Text style={styles.entryTitle}>{entry.title || entry.position}</Text>
          <Text style={styles.entrySubtitle}>{entry.company}</Text>
          {(entry.startDate || entry.endDate) && (
            <Text style={styles.entryDetails}>
              {entry.startDate || ''} {entry.startDate && entry.endDate && '- '}{entry.endDate || ''}
            </Text>
          )}
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

    // Education entry
    if (isEducationEntry(entry)) {
      return (
        <View key={idx} style={styles.entryContainer}>
          <Text style={styles.entryTitle}>{entry.degree}</Text>
          <Text style={styles.entrySubtitle}>{entry.school || entry.institution}</Text>
          {entry.graduationDate && <Text style={styles.entryDetails}>{entry.graduationDate}</Text>}
          {entry.gpa && <Text style={styles.entryDetails}>GPA: {entry.gpa}</Text>}
        </View>
      )
    }

    // Project entry
    if (isProjectEntry(entry)) {
      return (
        <View key={idx} style={styles.entryContainer}>
          <Text style={styles.entryTitle}>{entry.title || entry.name}</Text>
          {entry.description && <Text style={styles.textBlock}>{entry.description}</Text>}
          {entry.technologies && (
            <Text style={styles.entryDetails}>
              Technologies: {Array.isArray(entry.technologies) ? entry.technologies.join(', ') : entry.technologies}
            </Text>
          )}
        </View>
      )
    }

    // Certification entry
    if (isCertificationEntry(entry)) {
      return (
        <View key={idx} style={styles.entryContainer}>
          <Text style={styles.entryTitle}>{entry.name || entry.title}</Text>
          <Text style={styles.entrySubtitle}>{entry.issuer}</Text>
          {entry.date && <Text style={styles.entryDetails}>{entry.date}</Text>}
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

        {/* Main Section with dividers between major sections */}
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

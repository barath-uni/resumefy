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
      paddingTop: 30, // Consistent top padding on all pages
      paddingBottom: 30,
      paddingLeft: 0,
      paddingRight: 0,
      fontFamily: 'Helvetica',
      fontSize: 10,
      lineHeight: 1.4,
      color: '#2d3748',
      flexDirection: 'row', // Two-column layout
    },
    // Sidebar (left column) - visually distinct
    sidebar: {
      width: '30%',
      backgroundColor: '#F0F4F8',
      paddingLeft: 20,
      paddingRight: 20,
      borderRight: '2px solid #4299e1',
    },
    sidebarSection: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: '1px solid #CBD5E0',
    },
    sidebarTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 10,
      color: '#1A202C',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    contactItem: {
      fontSize: 8.5,
      marginBottom: 6,
      color: '#2D3748',
      lineHeight: 1.5,
    },
    skillItemContainer: {
      marginBottom: 8,
    },
    skillItem: {
      fontSize: 9,
      color: '#2D3748',
      flex: 1,
    },
    skillName: {
      fontSize: 9,
      marginBottom: 3,
      color: '#1A202C',
      fontFamily: 'Helvetica-Bold',
    },
    skillBarBackground: {
      height: 4,
      backgroundColor: '#CBD5E0',
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
      color: '#1A202C',
    },
    school: {
      fontSize: 8.5,
      marginBottom: 2,
      color: '#4A5568',
    },
    year: {
      fontSize: 8,
      color: '#718096',
    },
    // Main content (right column)
    main: {
      width: '70%',
      paddingLeft: 30,
      paddingRight: 30,
    },
    header: {
      marginBottom: 24,
      paddingBottom: 14,
      borderBottom: '4px solid #4299e1',
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 6,
      color: '#1A202C',
      lineHeight: 1.2,
    },
    jobTitle: {
      fontSize: 11,
      color: '#4299E1',
      marginBottom: 8,
      lineHeight: 1.3,
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
      minPresenceAhead: 30, // Prevent orphan - keep at least 30pt of next entry visible
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
      color: '#1A202C',
    },
    certIssuer: {
      fontSize: 8.5,
      color: '#4A5568',
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

  // Generic sidebar block renderer
  const renderSidebarBlock = (block: ContentBlock) => {
    // Contact block - special rendering
    if (block.category === 'contact') {
      const { content } = block
      return (
        <View key={block.id} style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>{getCategoryTitle(block.category)}</Text>
          {content.email && <Text style={styles.contactItem}>{content.email}</Text>}
          {content.phone && <Text style={styles.contactItem}>{content.phone}</Text>}
          {content.location && <Text style={styles.contactItem}>{content.location}</Text>}
          {content.linkedin && <Text style={styles.contactItem}>{content.linkedin}</Text>}
          {content.github && <Text style={styles.contactItem}>{content.github}</Text>}
          {content.website && <Text style={styles.contactItem}>{content.website}</Text>}
        </View>
      )
    }

    const { content, category } = block
    const sectionTitle = getCategoryTitle(category)

    // CASE 1: Array of skills (simple string array)
    if (isArrayContent(content) && content.every((item: any) => typeof item === 'string')) {
      return (
        <View key={block.id} style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>{sectionTitle}</Text>
          {content.map((skill: string, idx: number) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text style={styles.skillItem}>{skill}</Text>
            </View>
          ))}
        </View>
      )
    }

    // CASE 2: Array of education/certifications
    if (isArrayContent(content)) {
      return (
        <View key={block.id} style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>{sectionTitle}</Text>
          {content.map((entry: any, idx: number) => renderSidebarEntry(entry, idx))}
        </View>
      )
    }

    // CASE 3: Single object entry (education, certification)
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      // Check if it's a structured entry (has fields like degree, name, etc.)
      if (isEducationEntry(content) || isCertificationEntry(content)) {
        return (
          <View key={block.id} style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>{sectionTitle}</Text>
            {renderSidebarEntry(content, 0)}
          </View>
        )
      }
    }

    // CASE 4: Single text content
    const textContent = extractTextContent(content)
    if (textContent) {
      return (
        <View key={block.id} style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>{sectionTitle}</Text>
          <Text style={styles.contactItem}>{textContent}</Text>
        </View>
      )
    }

    return null
  }

  // Render sidebar entry (education, certifications, etc.)
  const renderSidebarEntry = (entry: any, idx: number) => {
    // Education entry
    if (isEducationEntry(entry)) {
      return (
        <View key={idx} style={styles.educationEntry}>
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
        <View key={idx} style={styles.certEntry}>
          <Text style={styles.certName}>{entry.name || entry.title}</Text>
          {entry.issuer && <Text style={styles.certIssuer}>{entry.issuer}</Text>}
          {entry.date && <Text style={styles.year}>{entry.date}</Text>}
        </View>
      )
    }

    // Fallback: text
    const textContent = extractTextContent(entry)
    if (textContent) {
      return <Text key={idx} style={styles.contactItem}>{textContent}</Text>
    }

    return null
  }

  // Generic main block renderer
  const renderMainBlock = (block: ContentBlock) => {
    const { content } = block

    // Single entry - render directly
    return renderMainEntry(content)
  }

  // Render main content entry (experience, projects, etc.)
  const renderMainEntry = (entry: any) => {
    // Experience entry
    if (isExperienceEntry(entry)) {
      return (
        <View style={styles.experienceEntry} wrap={false}>
          <Text style={styles.position}>{entry.title || entry.position}</Text>
          <Text style={styles.company}>{entry.company}</Text>
          {(entry.startDate || entry.endDate || entry.dates) && (
            <Text style={styles.dates}>
              {entry.dates || `${entry.startDate || ''} ${entry.startDate && entry.endDate ? '- ' : ''}${entry.endDate || ''}`}
            </Text>
          )}
          {entry.bullets && Array.isArray(entry.bullets) && (
            <View style={styles.bulletList}>
              {entry.bullets.map((bullet: string, idx: number) => (
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

    // Project entry
    if (isProjectEntry(entry)) {
      return (
        <View style={styles.experienceEntry}>
          <Text style={styles.position}>{entry.title || entry.name}</Text>
          {entry.description && <Text style={styles.summary}>{entry.description}</Text>}
          {entry.bullets && Array.isArray(entry.bullets) && (
            <View style={styles.bulletList}>
              {entry.bullets.map((bullet: string, idx: number) => (
                <View key={idx} style={styles.bullet}>
                  <Text style={styles.bulletSymbol}>▸</Text>
                  <Text>{bullet}</Text>
                </View>
              ))}
            </View>
          )}
          {entry.technologies && (
            <Text style={styles.dates}>
              Technologies: {Array.isArray(entry.technologies) ? entry.technologies.join(', ') : entry.technologies}
            </Text>
          )}
        </View>
      )
    }

    // Education entry (if in main section)
    if (isEducationEntry(entry)) {
      return (
        <View style={styles.experienceEntry}>
          <Text style={styles.position}>{entry.degree}</Text>
          <Text style={styles.company}>{entry.school || entry.institution}</Text>
          {entry.gpa && <Text style={styles.dates}>GPA: {entry.gpa}</Text>}
          {(entry.graduationDate || entry.year) && (
            <Text style={styles.dates}>{entry.graduationDate || entry.year}</Text>
          )}
        </View>
      )
    }

    // Certification entry (if in main section)
    if (isCertificationEntry(entry)) {
      return (
        <View style={styles.experienceEntry}>
          <Text style={styles.position}>{entry.name || entry.title}</Text>
          {entry.issuer && <Text style={styles.company}>{entry.issuer}</Text>}
          {entry.date && <Text style={styles.dates}>{entry.date}</Text>}
        </View>
      )
    }

    // Fallback: text content (summary, etc.)
    const textContent = extractTextContent(entry)
    if (textContent) {
      return <Text style={styles.summary}>{textContent}</Text>
    }

    return null
  }

  // Group blocks by category for section rendering
  const groupedMainBlocks: { [category: string]: ContentBlock[] } = {}
  mainBlocks.forEach(block => {
    if (!groupedMainBlocks[block.category]) {
      groupedMainBlocks[block.category] = []
    }
    groupedMainBlocks[block.category].push(block)
  })

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

          {/* Render all categories dynamically */}
          {Object.keys(groupedMainBlocks).map(category => {
            const categoryBlocks = groupedMainBlocks[category]
            const sectionTitle = getCategoryTitle(category)

            return (
              <View key={category}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {categoryBlocks.map((block, idx) => (
                  <View key={block.id || idx}>
                    {renderMainBlock(block)}
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

export default TemplateB

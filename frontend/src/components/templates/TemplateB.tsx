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

// Template B: Modern Two-Column Layout
// Sidebar (30%): Skills, Education, Certifications, Contact info
// Main (70%): Name, Summary, Experience, Projects

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
      color: '#333333',
      flexDirection: 'row', // Two-column layout
    },
    // Sidebar (left column)
    sidebar: {
      width: '30%',
      backgroundColor: '#F5F7FA',
      paddingLeft: 20,
      paddingRight: 20,
      borderRight: '2px solid #E2E8F0',
    },
    sidebarSection: {
      marginBottom: 16,
    },
    sidebarTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 8,
      color: '#2D3748',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    contactItem: {
      fontSize: 9,
      marginBottom: 4,
      color: '#4A5568',
    },
    skillItem: {
      fontSize: 9,
      marginBottom: 3,
      paddingLeft: 8,
      color: '#4A5568',
    },
    educationEntry: {
      marginBottom: 10,
    },
    degree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#2D3748',
    },
    school: {
      fontSize: 9,
      marginBottom: 1,
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
      marginBottom: 20,
      paddingBottom: 12,
      borderBottom: '3px solid #4299E1',
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
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      marginTop: 16,
      marginBottom: 8,
      color: '#2D3748',
      textTransform: 'uppercase',
      borderBottom: '2px solid #E2E8F0',
      paddingBottom: 4,
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
      marginBottom: 10,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2,
      color: '#2D3748',
    },
    certIssuer: {
      fontSize: 9,
      color: '#4A5568',
    },
  })
}

const TemplateB: React.FC<TemplateBProps> = ({ blocks, layout }) => {
  const styles = createStyles(layout)

  // DEBUG: Log ALL blocks to see structure
  console.log('🎨 [Template B] Rendering with blocks:', blocks.length)
  console.log('🎨 [Template B] First 3 blocks:', blocks.slice(0, 3))
  console.log('🎨 [Template B] Education blocks:', blocks.filter(b => b.category === 'education'))
  console.log('🎨 [Template B] Certification blocks:', blocks.filter(b => b.category === 'certifications'))

  // Sort blocks by placement order
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = layout.placement[a.id]?.order ?? 999
    const orderB = layout.placement[b.id]?.order ?? 999
    return orderA - orderB
  })

  // Separate blocks by section
  const sidebarBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'sidebar')
  const mainBlocks = sortedBlocks.filter(b => layout.placement[b.id]?.section === 'main')

  console.log('🎨 [Template B] Sidebar blocks:', sidebarBlocks.map(b => ({ id: b.id, category: b.category })))
  console.log('🎨 [Template B] Main blocks:', mainBlocks.map(b => ({ id: b.id, category: b.category })))

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
    console.log('🔍 [renderSidebarEntry] idx:', idx)
    console.log('🔍 [renderSidebarEntry] entry:', entry)
    console.log('🔍 [renderSidebarEntry] isEducation:', isEducationEntry(entry))
    console.log('🔍 [renderSidebarEntry] isCertification:', isCertificationEntry(entry))

    // Education entry
    if (isEducationEntry(entry)) {
      console.log('Education entry found')
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

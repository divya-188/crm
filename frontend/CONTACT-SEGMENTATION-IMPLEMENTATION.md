# Contact Segmentation Implementation

## Overview

This document describes the implementation of the contact segmentation feature, which allows users to create dynamic segments of contacts based on complex criteria with AND/OR logic.

## Features Implemented

### 1. Segment Builder
- **Location**: `frontend/src/components/contacts/SegmentBuilder.tsx`
- **Features**:
  - Visual builder for creating segment criteria
  - Support for AND/OR logic between conditions
  - Multiple field types: firstName, lastName, email, phone, tags, notes, dates
  - 12 operators: equals, not_equals, contains, not_contains, starts_with, ends_with, is_empty, is_not_empty, greater_than, less_than, in, not_in
  - Real-time preview of matching contact count
  - Add/remove conditions dynamically

### 2. Segment List
- **Location**: `frontend/src/components/contacts/SegmentList.tsx`
- **Features**:
  - Grid display of all saved segments
  - Shows contact count for each segment
  - Displays criteria summary (logic type and condition count)
  - Actions: View, Edit, Delete
  - Empty state when no segments exist
  - Loading states with skeleton screens

### 3. Segment Modal (Create/Edit)
- **Location**: `frontend/src/components/contacts/SegmentModal.tsx`
- **Features**:
  - Create new segments or edit existing ones
  - Name and description fields
  - Embedded segment builder
  - Preview functionality to see matching contact count
  - Form validation
  - Success/error handling with toast notifications

### 4. Segment View Modal
- **Location**: `frontend/src/components/contacts/SegmentViewModal.tsx`
- **Features**:
  - View segment details and criteria
  - List of contacts matching the segment
  - Pagination for large contact lists
  - Contact cards with avatar, name, email, phone, and tags
  - Criteria display showing all conditions

### 5. Updated Contacts Page
- **Location**: `frontend/src/pages/Contacts.tsx`
- **Features**:
  - Tab navigation between "All Contacts" and "Segments"
  - Context-aware action buttons (different for each tab)
  - Integrated segment management
  - Maintains existing contact management functionality

## Backend Implementation

### 1. Segment Entity
- **Location**: `backend/src/modules/contacts/entities/segment.entity.ts`
- **Fields**:
  - id, tenantId, name, description
  - criteria (JSONB): stores the segment logic and conditions
  - contactCount: cached count of matching contacts
  - lastCalculatedAt: timestamp of last count calculation
  - createdAt, updatedAt

### 2. Segment DTOs
- **CreateSegmentDto**: `backend/src/modules/contacts/dto/create-segment.dto.ts`
- **UpdateSegmentDto**: `backend/src/modules/contacts/dto/update-segment.dto.ts`
- **Interfaces**: SegmentCriteria, SegmentCondition

### 3. Segment Service Methods
- **Location**: `backend/src/modules/contacts/contacts.service.ts`
- **Methods**:
  - `createSegment()`: Create new segment with initial count
  - `findAllSegments()`: Get all segments for tenant
  - `findOneSegment()`: Get single segment by ID
  - `updateSegment()`: Update segment and recalculate count
  - `removeSegment()`: Delete segment
  - `previewSegment()`: Preview contacts matching criteria (returns count + sample)
  - `getSegmentContacts()`: Get paginated list of contacts in segment
  - `calculateSegmentCount()`: Calculate number of matching contacts
  - `buildSegmentQuery()`: Build TypeORM query from criteria
  - `applyCondition()`: Apply individual condition to query

### 4. Segment API Endpoints
- **Location**: `backend/src/modules/contacts/contacts.controller.ts`
- **Endpoints**:
  - `POST /contacts/segments` - Create segment
  - `GET /contacts/segments` - List all segments
  - `GET /contacts/segments/:id` - Get segment details
  - `PATCH /contacts/segments/:id` - Update segment
  - `DELETE /contacts/segments/:id` - Delete segment
  - `POST /contacts/segments/preview` - Preview segment
  - `GET /contacts/segments/:id/contacts` - Get segment contacts

### 5. Database Migration
- **Location**: `backend/src/database/migrations/1700000000007-CreateContactSegmentsTable.ts`
- **SQL Script**: `backend/scripts/create-segments-table.sql`
- Creates `contact_segments` table with proper indexes and foreign keys

## Segment Criteria Structure

```typescript
interface SegmentCriteria {
  logic: 'AND' | 'OR';
  conditions: SegmentCondition[];
}

interface SegmentCondition {
  field: string;
  operator: string;
  value: any;
}
```

### Supported Fields
- Standard fields: firstName, lastName, email, phone, tags, notes
- Date fields: lastContactedAt, createdAt
- Custom fields: customFields.{fieldName}

### Supported Operators
1. **equals**: Exact match
2. **not_equals**: Not equal to
3. **contains**: Contains substring (case-insensitive)
4. **not_contains**: Does not contain substring
5. **starts_with**: Starts with string
6. **ends_with**: Ends with string
7. **is_empty**: Field is null or empty string
8. **is_not_empty**: Field has a value
9. **greater_than**: Numeric/date comparison
10. **less_than**: Numeric/date comparison
11. **in**: Value in list (for tags and multi-select)
12. **not_in**: Value not in list

## Query Building Logic

The segment query builder supports:
- **AND logic**: All conditions must be true
- **OR logic**: Any condition can be true
- **Custom fields**: JSONB field queries using PostgreSQL operators
- **Array fields**: Special handling for tags using PostgreSQL array operators
- **Type casting**: Automatic casting for numeric comparisons on custom fields

## Usage Examples

### Example 1: Active VIP Customers
```json
{
  "name": "Active VIP Customers",
  "description": "Customers with VIP tag who were contacted in last 30 days",
  "criteria": {
    "logic": "AND",
    "conditions": [
      {
        "field": "tags",
        "operator": "in",
        "value": ["VIP"]
      },
      {
        "field": "lastContactedAt",
        "operator": "greater_than",
        "value": "2024-01-01"
      }
    ]
  }
}
```

### Example 2: Potential Leads
```json
{
  "name": "Potential Leads",
  "description": "Contacts with email but never contacted",
  "criteria": {
    "logic": "AND",
    "conditions": [
      {
        "field": "email",
        "operator": "is_not_empty",
        "value": null
      },
      {
        "field": "lastContactedAt",
        "operator": "is_empty",
        "value": null
      }
    ]
  }
}
```

### Example 3: Inactive Contacts
```json
{
  "name": "Inactive Contacts",
  "description": "Contacts not contacted in 90+ days or never contacted",
  "criteria": {
    "logic": "OR",
    "conditions": [
      {
        "field": "lastContactedAt",
        "operator": "is_empty",
        "value": null
      },
      {
        "field": "lastContactedAt",
        "operator": "less_than",
        "value": "2023-10-01"
      }
    ]
  }
}
```

## Integration with Campaigns

Segments can be used in campaign creation to target specific contact groups. The segment criteria can be passed to the campaign creation endpoint to automatically filter recipients.

## Performance Considerations

1. **Caching**: Contact counts are cached in the segment entity
2. **Indexes**: Database indexes on tenantId, name, and commonly filtered fields
3. **Pagination**: Segment contacts are paginated to handle large segments
4. **Preview Limit**: Preview returns only first 10 contacts for quick feedback
5. **Query Optimization**: Uses TypeORM query builder for efficient SQL generation

## Future Enhancements

1. **Nested Conditions**: Support for nested AND/OR groups
2. **Saved Filters**: Quick filters from segments in contact list
3. **Segment Analytics**: Track segment growth over time
4. **Auto-refresh**: Automatic recalculation of contact counts
5. **Segment Templates**: Pre-built segment templates for common use cases
6. **Export Segments**: Export contacts from specific segments
7. **Segment Comparison**: Compare multiple segments
8. **Behavioral Criteria**: Add criteria based on message history and engagement

## Testing

To test the segment feature:

1. Navigate to Contacts page
2. Click on "Segments" tab
3. Click "Create Segment" button
4. Add segment name and description
5. Add conditions using the builder
6. Click "Preview" to see matching count
7. Save the segment
8. View segment to see matching contacts
9. Edit or delete segments as needed

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 11.5**: Dynamic segments based on contact attributes and behavior
- **Requirement 21.1**: Segment creation with AND/OR logic
- **Requirement 21.2**: Segmentation based on contact fields, tags, message history, and engagement metrics
- **Requirement 21.3**: Dynamic segments that update automatically
- **Requirement 21.4**: Real-time segment size display
- **Requirement 21.5**: Saved segments for reuse
- **Requirement 21.6**: Negative criteria support (not_equals, not_contains, not_in)

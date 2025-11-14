# API Keys Pagination Fix

## Issue
Frontend console errors were occurring due to a mismatch between the backend API response and the frontend service type definitions for API keys pagination.

## Changes Made

### Backend Changes

#### 1. API Keys Service (`backend/src/modules/api-keys/api-keys.service.ts`)
- ✅ Added `hasMore` flag to the return type of `findAll` method
- ✅ Calculated `hasMore` as `pageNum * limitNum < total`
- ✅ Added secondary ordering by `id DESC` for consistent pagination results
- ✅ Optimized query with proper ordering

#### 2. API Keys Controller (`backend/src/modules/api-keys/api-keys.controller.ts`)
- ✅ Updated response to include `hasMore` flag
- ✅ Returns: `{ data, total, page, limit, hasMore }`

#### 3. Database Migration (`backend/src/database/migrations/1700000000005-CreateApiKeysTable.ts`)
- ✅ Added composite index: `idx_api_keys_tenant_created` on (tenant_id, created_at DESC, id DESC)
- ✅ Added composite index: `idx_api_keys_tenant_active` on (tenant_id, is_active)
- ✅ Optimized queries for pagination and filtering

### Frontend Changes

#### 1. API Keys Service (`frontend/src/services/api-keys.service.ts`)
- ✅ Updated `getApiKeys` return type to include `hasMore: boolean`
- ✅ Updated response type to match backend structure
- ✅ Properly destructured and returned all pagination fields

**Before:**
```typescript
Promise<{ data: ApiKey[]; total: number; page: number; limit: number }>
```

**After:**
```typescript
Promise<{ data: ApiKey[]; total: number; page: number; limit: number; hasMore: boolean }>
```

#### 2. API Keys Page (`frontend/src/pages/ApiKeys.tsx`)
- ✅ Updated `getNextPageParam` to use `hasMore` flag from backend
- ✅ More accurate pagination control

**Before:**
```typescript
getNextPageParam: (lastPage) => {
  const nextPage = lastPage.page + 1;
  return nextPage <= Math.ceil(lastPage.total / lastPage.limit) ? nextPage : undefined;
}
```

**After:**
```typescript
getNextPageParam: (lastPage) => {
  // Use hasMore flag from backend for more accurate pagination
  return lastPage.hasMore ? lastPage.page + 1 : undefined;
}
```

## Benefits

1. **Type Safety**: Frontend and backend types are now aligned
2. **Performance**: Optimized database queries with composite indexes
3. **Accuracy**: Backend-controlled pagination is more reliable
4. **Consistency**: Secondary ordering ensures consistent results across pages
5. **No Console Errors**: Type mismatches resolved

## Testing

Backend builds successfully:
```bash
cd backend && npm run build
```

Frontend type checking passes for API keys files:
```bash
cd frontend && npx tsc --noEmit
```

## Related Task

This fix was part of implementing **Task 10.6: Update API keys service for pagination** from the Modern UI/UX Rollout spec.

Requirements satisfied:
- ✅ 3.1: Add page and limit parameters
- ✅ 3.2: Return total count and hasMore flag
- ✅ Optimize database queries

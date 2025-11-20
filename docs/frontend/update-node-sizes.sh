#!/bin/bash

# Script to update all flow builder nodes to 50% size

# Update ConditionNode
sed -i '' 's/min-w-\[220px\] max-w-\[280px\]/min-w-[110px] max-w-[140px]/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/px-4 py-3 rounded-lg/px-3 py-2 rounded-lg/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/p-1.5 rounded-lg/p-1 rounded-lg/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/w-4 h-4 text-secondary-600/w-3 h-3 text-secondary-600/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/font-semibold text-sm/font-semibold text-xs/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/w-3.5 h-3.5/w-3 h-3/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/text-xs text-neutral-600 line-clamp-2 mb-2/text-[10px] text-neutral-600 line-clamp-2 mb-1.5/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/text-xs text-neutral-500 mt-3 pt-2/text-[10px] text-neutral-500 mt-2 pt-1.5/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded mt-2/text-[10px] text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded mt-1.5/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx
sed -i '' 's/Configuration required/Config needed/g' frontend/src/components/flow-builder/nodes/ConditionNode.tsx

# Update InputNode
sed -i '' 's/min-w-\[220px\] max-w-\[280px\]/min-w-[110px] max-w-[140px]/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/px-4 py-3 rounded-lg/px-3 py-2 rounded-lg/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/p-1.5 rounded-lg/p-1 rounded-lg/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/w-4 h-4 text-accent-600/w-3 h-3 text-accent-600/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/font-semibold text-sm/font-semibold text-xs/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/w-3.5 h-3.5/w-3 h-3/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/text-xs text-neutral-600 line-clamp-2/text-[10px] text-neutral-600 line-clamp-2/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded mt-2/text-[10px] text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded mt-1.5/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/Configuration required/Config needed/g' frontend/src/components/flow-builder/nodes/InputNode.tsx
sed -i '' 's/Click to set prompt.../Click to edit.../g' frontend/src/components/flow-builder/nodes/InputNode.tsx

# Update APINode
sed -i '' 's/min-w-\[220px\] max-w-\[280px\]/min-w-[110px] max-w-[140px]/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/px-4 py-3 rounded-lg/px-3 py-2 rounded-lg/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/p-1.5 rounded-lg/p-1 rounded-lg/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/w-4 h-4 text-success-600/w-3 h-3 text-success-600/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/font-semibold text-sm/font-semibold text-xs/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/w-3.5 h-3.5/w-3 h-3/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/text-xs text-neutral-600 line-clamp-2 font-mono/text-[10px] text-neutral-600 line-clamp-2 font-mono/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded mt-2/text-[10px] text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded mt-1.5/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/Configuration required/Config needed/g' frontend/src/components/flow-builder/nodes/APINode.tsx
sed -i '' 's/Click to set API endpoint.../Click to edit.../g' frontend/src/components/flow-builder/nodes/APINode.tsx

# Update DelayNode
sed -i '' 's/min-w-\[220px\] max-w-\[280px\]/min-w-[110px] max-w-[140px]/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/px-4 py-3 rounded-lg/px-3 py-2 rounded-lg/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/p-1.5 rounded-lg/p-1 rounded-lg/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/w-4 h-4 text-secondary-600/w-3 h-3 text-secondary-600/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/font-semibold text-sm/font-semibold text-xs/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/w-3.5 h-3.5/w-3 h-3/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/text-xs text-neutral-600 mb-2/text-[10px] text-neutral-600 mb-1.5/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded mt-2/text-[10px] text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded mt-1.5/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/Configuration required/Config needed/g' frontend/src/components/flow-builder/nodes/DelayNode.tsx
sed -i '' 's/Click to set delay.../Click to edit.../g' frontend/src/components/flow-builder/nodes/DelayNode.tsx

echo "Node sizes updated successfully!"

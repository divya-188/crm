export { default as MessageNode } from './MessageNode';
export { default as ConditionNode } from './ConditionNode';
export { default as InputNode } from './InputNode';
export { default as DelayNode } from './DelayNode';
export { default as APINode } from './APINode';
export { default as WebhookNode } from './WebhookNode';
export { default as AssignmentNode } from './AssignmentNode';
export { default as TagNode } from './TagNode';
export { default as ButtonNode } from './ButtonNode';
export { default as TemplateNode } from './TemplateNode';
export { default as StartNode } from './StartNode';
export { default as EndNode } from './EndNode';

// Export node types configuration
import MessageNode from './MessageNode';
import ConditionNode from './ConditionNode';
import InputNode from './InputNode';
import DelayNode from './DelayNode';
import APINode from './APINode';
import WebhookNode from './WebhookNode';
import AssignmentNode from './AssignmentNode';
import TagNode from './TagNode';
import ButtonNode from './ButtonNode';
import TemplateNode from './TemplateNode';
import StartNode from './StartNode';
import EndNode from './EndNode';

export const nodeTypes = {
  message: MessageNode,
  template: TemplateNode,
  condition: ConditionNode,
  input: InputNode,
  button: ButtonNode,
  delay: DelayNode,
  api: APINode,
  webhook: WebhookNode,
  assignment: AssignmentNode,
  tag: TagNode,
  start: StartNode,
  end: EndNode,
};

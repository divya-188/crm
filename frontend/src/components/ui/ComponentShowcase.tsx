/**
 * Component Showcase
 * This file demonstrates all UI components and their usage
 * Can be used as a reference or style guide
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Select,
  Textarea,
  Checkbox,
  Switch,
  Card,
  Modal,
  Alert,
  Badge,
  Spinner,
  Tooltip,
  Skeleton,
  ProgressBar,
  DotsLoader,
} from './index';
import { Icons } from '../../lib/icons';
import Toast from '@/lib/toast-system';
import { staggerContainer } from '../../lib/motion-variants';

const ComponentShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            UI Component Library
          </h1>
          <p className="text-neutral-600">
            A comprehensive design system built with React, Tailwind CSS, and Framer Motion
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.section
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <Card>
            <h2 className="text-2xl font-bold mb-4">Buttons</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button icon={<Icons.plus size={16} />}>With Icon</Button>
                <Button icon={<Icons.download size={16} />} iconPosition="right">
                  Download
                </Button>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Form Inputs */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Form Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              icon={<Icons.mail size={18} />}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              icon={<Icons.lock size={18} />}
            />
            <Input
              label="With Error"
              error="This field is required"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="With Helper Text"
              helperText="We'll never share your email"
            />
            <Select
              label="Select Option"
              options={[
                { value: '1', label: 'Option 1' },
                { value: '2', label: 'Option 2' },
                { value: '3', label: 'Option 3' },
              ]}
              placeholder="Choose an option"
            />
            <div className="md:col-span-2">
              <Textarea
                label="Message"
                placeholder="Enter your message"
                rows={4}
              />
            </div>
          </div>
        </Card>

        {/* Checkboxes and Switches */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Checkboxes & Switches</h2>
          <div className="space-y-4">
            <Checkbox
              label="Accept terms and conditions"
              checked={checkboxValue}
              onChange={(e) => setCheckboxValue(e.target.checked)}
            />
            <Switch
              label="Enable notifications"
              description="Receive email notifications for new messages"
              checked={switchValue}
              onChange={(e) => setSwitchValue(e.target.checked)}
            />
            <div className="flex gap-4">
              <Switch size="sm" label="Small" />
              <Switch size="md" label="Medium" />
              <Switch size="lg" label="Large" />
            </div>
          </div>
        </Card>

        {/* Badges */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="primary" dot>
              With Dot
            </Badge>
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </div>
        </Card>

        {/* Alerts */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Alerts</h2>
          <div className="space-y-4">
            <Alert variant="info" message="This is an informational message" />
            <Alert
              variant="success"
              title="Success!"
              message="Your changes have been saved successfully"
            />
            <Alert
              variant="warning"
              title="Warning"
              message="Please review your information before proceeding"
            />
            <Alert
              variant="danger"
              title="Error"
              message="Something went wrong. Please try again"
              dismissible
              onDismiss={() => console.log('Dismissed')}
            />
          </div>
        </Card>

        {/* Loading States */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Loading States</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Spinners</h3>
              <div className="flex items-center gap-6">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
                <Spinner size="xl" />
                <DotsLoader />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Progress Bar</h3>
              <div className="space-y-3">
                <ProgressBar value={30} showLabel />
                <ProgressBar value={60} variant="success" showLabel />
                <ProgressBar value={90} variant="danger" showLabel />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Skeleton Loaders</h3>
              <div className="space-y-3">
                <Skeleton width="100%" height={20} />
                <Skeleton width="80%" height={20} />
                <Skeleton width="60%" height={20} />
                <div className="flex gap-3">
                  <Skeleton variant="circular" width={48} height={48} />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="100%" height={12} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Modal & Tooltips */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Modal & Tooltips</h2>
          <div className="space-y-4">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <div className="flex gap-4">
              <Tooltip content="This is a tooltip" position="top">
                <Button variant="outline">Hover me (Top)</Button>
              </Tooltip>
              <Tooltip content="Bottom tooltip" position="bottom">
                <Button variant="outline">Hover me (Bottom)</Button>
              </Tooltip>
              <Tooltip content="Left tooltip" position="left">
                <Button variant="outline">Hover me (Left)</Button>
              </Tooltip>
              <Tooltip content="Right tooltip" position="right">
                <Button variant="outline">Hover me (Right)</Button>
              </Tooltip>
            </div>
          </div>
        </Card>

        {/* Toast Notifications */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Toast Notifications</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="success"
              onClick={() => Toast.success('Operation completed successfully!')}
            >
              Success Toast
            </Button>
            <Button
              variant="danger"
              onClick={() => Toast.error('An error occurred!')}
            >
              Error Toast
            </Button>
            <Button
              variant="warning"
              onClick={() => Toast.warning('Please review your input')}
            >
              Warning Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => Toast.info('Here is some information')}
            >
              Info Toast
            </Button>
          </div>
        </Card>

        {/* Icons */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">Icon Library</h2>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
            <Tooltip content="User">
              <div className="flex items-center justify-center p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors">
                <Icons.user size={24} />
              </div>
            </Tooltip>
            <Tooltip content="Message">
              <div className="flex items-center justify-center p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors">
                <Icons.message size={24} />
              </div>
            </Tooltip>
            <Tooltip content="Settings">
              <div className="flex items-center justify-center p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors">
                <Icons.settings size={24} />
              </div>
            </Tooltip>
            <Tooltip content="Calendar">
              <div className="flex items-center justify-center p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors">
                <Icons.calendar size={24} />
              </div>
            </Tooltip>
            <Tooltip content="Chart">
              <div className="flex items-center justify-center p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors">
                <Icons.barChart size={24} />
              </div>
            </Tooltip>
            <Tooltip content="Bell">
              <div className="flex items-center justify-center p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors">
                <Icons.bell size={24} />
              </div>
            </Tooltip>
          </div>
        </Card>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default" hoverable>
            <h3 className="font-semibold mb-2">Default Card</h3>
            <p className="text-sm text-neutral-600">
              This is a default card with hover effect
            </p>
          </Card>
          <Card variant="bordered" hoverable>
            <h3 className="font-semibold mb-2">Bordered Card</h3>
            <p className="text-sm text-neutral-600">
              This card has a thicker border
            </p>
          </Card>
          <Card variant="elevated" hoverable>
            <h3 className="font-semibold mb-2">Elevated Card</h3>
            <p className="text-sm text-neutral-600">
              This card has more shadow
            </p>
          </Card>
        </div>
      </div>

      {/* Modal Example */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        description="This is a modal dialog example"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-neutral-600">
          This is the modal content. You can put any content here including forms,
          images, or other components.
        </p>
      </Modal>
    </div>
  );
};

export default ComponentShowcase;

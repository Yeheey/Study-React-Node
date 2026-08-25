import type { ReactNode } from 'react'
import { Flex, Typography } from 'antd'

interface PageShellProps {
  title: string
  description: string
  extra?: ReactNode
  children: ReactNode
}

export default function PageShell({ title, description, extra, children }: PageShellProps) {
  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="flex-start" gap={12} wrap="wrap">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
            {description}
          </Typography.Paragraph>
        </div>
        {extra}
      </Flex>
      {children}
    </Flex>
  )
}

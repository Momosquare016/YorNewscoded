import { useEffect, useState } from 'react';
import {
  Layout,
  Typography,
  Card,
  Button,
  Input,
  Alert,
  List,
  Tag,
  Modal,
  Space,
  Popconfirm,
  Spin,
  message,
} from 'antd';
import { CopyOutlined, DeleteOutlined, PlusOutlined, KeyOutlined } from '@ant-design/icons';
import { api } from '../utils/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState(null); // shown once after creation

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const data = await api.listApiKeys();
      setKeys(data.keys || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setError('');
    if (!name.trim()) {
      setError('Give the key a name (e.g. "Matteca")');
      return;
    }
    try {
      setCreating(true);
      const data = await api.createApiKey(name.trim());
      setNewKey({ key: data.key, record: data.record });
      setName('');
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id) {
    try {
      await api.revokeApiKey(id);
      message.success('Key revoked');
      await refresh();
    } catch (err) {
      message.error(err.message || 'Failed to revoke');
    }
  }

  function copyKey(k) {
    navigator.clipboard.writeText(k).then(
      () => message.success('Copied'),
      () => message.error('Clipboard write failed')
    );
  }

  return (
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 56px)' }}>
      <Content
        style={{
          padding: '24px 16px',
          maxWidth: 760,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#fff', margin: 0, fontSize: 22 }}>
            API Keys
          </Title>
          <Text style={{ color: '#666', fontSize: 13 }}>
            Use these to pull your personalised news into other apps (e.g. Matteca).
          </Text>
          <div
            style={{ width: 40, height: 3, background: '#f5c518', margin: '14px auto 0' }}
          />
        </div>

        <Card
          style={{ background: '#111', border: '1px solid #222' }}
          styles={{ body: { padding: 20 } }}
        >
          {error && (
            <Alert description={error} type="error" showIcon style={{ marginBottom: 16 }} />
          )}

          <Text style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 8 }}>
            Create a new key
          </Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Name (e.g. "Matteca production")'
              disabled={creating}
              maxLength={100}
              style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              loading={creating}
              style={{ background: '#f5c518', borderColor: '#f5c518', color: '#000' }}
            >
              Create
            </Button>
          </Space.Compact>

          <div style={{ marginTop: 24 }}>
            <Text style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 8 }}>
              Your keys
            </Text>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : keys.length === 0 ? (
              <Paragraph style={{ color: '#555', fontSize: 13, margin: 0 }}>
                No keys yet.
              </Paragraph>
            ) : (
              <List
                dataSource={keys}
                renderItem={(k) => {
                  const revoked = !!k.revoked_at;
                  return (
                    <List.Item
                      style={{
                        background: '#0a0a0a',
                        border: '1px solid #222',
                        padding: '12px 16px',
                        marginBottom: 8,
                      }}
                      actions={
                        revoked
                          ? []
                          : [
                              <Popconfirm
                                key="revoke"
                                title="Revoke this key?"
                                description="Anything using it will stop working."
                                onConfirm={() => handleRevoke(k.id)}
                                okText="Revoke"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                              >
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  size="small"
                                >
                                  Revoke
                                </Button>
                              </Popconfirm>,
                            ]
                      }
                    >
                      <List.Item.Meta
                        avatar={<KeyOutlined style={{ color: '#f5c518', fontSize: 18 }} />}
                        title={
                          <Space>
                            <Text style={{ color: '#fff' }}>{k.name}</Text>
                            {revoked && <Tag color="red">revoked</Tag>}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={2}>
                            <Text code style={{ color: '#888', fontSize: 12 }}>
                              {k.key_prefix}…
                            </Text>
                            <Text style={{ color: '#555', fontSize: 11 }}>
                              Created {new Date(k.created_at).toLocaleDateString()}
                              {k.last_used_at
                                ? ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`
                                : ' · never used'}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </div>
        </Card>

        <Card
          style={{ background: '#111', border: '1px solid #222', marginTop: 16 }}
          styles={{ body: { padding: 20 } }}
        >
          <Text style={{ color: '#888', fontSize: 12, letterSpacing: 1 }}>USAGE</Text>
          <Paragraph style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>
            Pass the key as a bearer token against <Text code>GET /api/v1/news</Text>. The
            response mirrors the personalised feed on your dashboard — articles ranked by
            your current preferences.
          </Paragraph>
          <pre
            style={{
              background: '#0a0a0a',
              border: '1px solid #222',
              padding: 12,
              color: '#f5c518',
              fontSize: 12,
              overflow: 'auto',
              margin: 0,
            }}
          >
{`curl -H "Authorization: Bearer yorn_..." \\
  https://<yornews-host>/api/v1/news`}
          </pre>
        </Card>
      </Content>

      <Modal
        open={!!newKey}
        title="Copy your new API key"
        onCancel={() => setNewKey(null)}
        onOk={() => setNewKey(null)}
        okText="I've copied it"
        cancelButtonProps={{ style: { display: 'none' } }}
        styles={{
          content: { background: '#111', border: '1px solid #222' },
          header: { background: '#111', borderBottom: '1px solid #222' },
        }}
      >
        <Alert
          message="This is the only time the full key is shown."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Text
            code
            style={{
              color: '#f5c518',
              fontSize: 13,
              flex: 1,
              wordBreak: 'break-all',
            }}
          >
            {newKey?.key}
          </Text>
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyKey(newKey.key)}
            size="small"
          >
            Copy
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

export default ApiKeys;

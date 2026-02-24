'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, Users, BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { sendWhatsAppMessage, sendBulkWhatsAppMessages, getWhatsAppTemplates, formatPhoneNumber } from '@/lib/actions/whatsapp';

interface WhatsAppFormProps {
  classes?: Array<{ id: string; class_name: string }>;
}

export function WhatsAppForm({ classes = [] }: WhatsAppFormProps) {
  const [sendType, setSendType] = useState<'single' | 'bulk'>('single');
  const [bulkType, setBulkType] = useState<'class' | 'all' | 'custom'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customPhones, setCustomPhones] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const templates = [
    { value: '', label: 'Custom Message' },
    { value: 'payment', label: 'Payment Reminder' },
    { value: 'attendance', label: 'Attendance Alert' },
    { value: 'announcement', label: 'General Announcement' },
  ];

  const handleTemplateSelect = (value: string) => {
    const templateMessages: Record<string, string> = {
      payment: 'Hi, this is a reminder about your pending fee payment. Please make the payment at your earliest convenience. Thank you!',
      attendance: 'Dear Parent, your child was marked absent today. Please contact us if you have any concerns.',
      announcement: 'Important Announcement: [Your message here]',
    };

    setMessage(templateMessages[value] || '');
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a message',
      });
      return;
    }

    setLoading(true);

    try {
      if (sendType === 'single') {
        if (!phoneNumber.trim()) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please enter a phone number',
          });
          setLoading(false);
          return;
        }

        const formattedPhone = await formatPhoneNumber(phoneNumber);
        const result = await sendWhatsAppMessage({
          to: formattedPhone,
          message: message.trim(),
          type: 'text',
        });

        if (result.success) {
          toast({
            title: 'Success',
            description: 'WhatsApp message sent successfully',
          });
          setPhoneNumber('');
          setMessage('');
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to send message',
          });
        }
      } else {
        // Bulk send
        let recipients: string[] = [];

        if (bulkType === 'custom') {
          recipients = await Promise.all(
            customPhones
              .split(',')
              .map(p => formatPhoneNumber(p.trim()))
          );
          recipients = recipients.filter(Boolean);
        }

        if (bulkType === 'class' && !selectedClass) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a class',
          });
          setLoading(false);
          return;
        }

        const result = await sendBulkWhatsAppMessages({
          recipients,
          message: message.trim(),
          type: bulkType,
          classId: bulkType === 'class' ? selectedClass : undefined,
        });

        if (result.success) {
          toast({
            title: 'Bulk Send Complete',
            description: `Sent: ${result.sent}, Failed: ${result.failed}`,
          });
          setMessage('');
          setCustomPhones('');
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to send bulk messages',
          });
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          Send WhatsApp Message
        </CardTitle>
        <CardDescription>
          Send WhatsApp messages to students and parents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Send Type Selection */}
        <div className="space-y-2">
          <Label>Send Type</Label>
          <Select value={sendType} onValueChange={(v: 'single' | 'bulk') => setSendType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Message</SelectItem>
              <SelectItem value="bulk">Bulk Message</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Single Message Form */}
        {sendType === 'single' && (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+94771234567 or 0771234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter phone number with country code (e.g., +94771234567)
            </p>
          </div>
        )}

        {/* Bulk Message Options */}
        {sendType === 'bulk' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select value={bulkType} onValueChange={(v: 'class' | 'all' | 'custom') => setBulkType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Specific Class
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Students
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">Custom List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkType === 'class' && (
              <div className="space-y-2">
                <Label htmlFor="class-select">Select Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class-select">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {bulkType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-phones">Phone Numbers</Label>
                <Textarea
                  id="custom-phones"
                  placeholder="Enter phone numbers separated by commas&#10;e.g., +94771234567, +94772345678"
                  value={customPhones}
                  onChange={(e) => setCustomPhones(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="template">Message Template (Optional)</Label>
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger id="template">
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            {message.length} characters
          </p>
        </div>

        {/* Send Button */}
        <Button onClick={handleSend} disabled={loading} className="w-full gap-2">
          <Send className="h-4 w-4" />
          {loading ? 'Sending...' : sendType === 'single' ? 'Send Message' : 'Send to All'}
        </Button>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> WhatsApp integration is currently in mock mode.
            In production, this will integrate with WhatsApp Business API.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

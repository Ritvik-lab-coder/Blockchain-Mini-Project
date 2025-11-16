import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateElection } from '@/hooks/useAdminElections';
import { Plus, X, ArrowLeft, Loader2 } from 'lucide-react';

const createElectionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  electionType: z.enum(['general', 'local', 'organizational', 'poll']),
  candidates: z.array(
    z.object({
      name: z.string().min(2, 'Name is required'),
      description: z.string().optional(),
      party: z.string().optional(),
    })
  ).min(1, 'At least one candidate is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

type CreateElectionFormData = z.infer<typeof createElectionSchema>;

export const CreateElection = () => {
  const navigate = useNavigate();
  const createMutation = useCreateElection();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateElectionFormData>({
    resolver: zodResolver(createElectionSchema),
    defaultValues: {
      electionType: 'general',
      candidates: [{ name: '', description: '', party: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'candidates',
  });

  const onSubmit = async (data: CreateElectionFormData) => {
    try {
      await createMutation.mutateAsync(data);
      navigate('/admin/elections');
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/admin/elections')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Elections
        </Button>
        <h1 className="text-3xl font-bold">Create Election</h1>
        <p className="text-muted-foreground">Create a new election on the blockchain</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Election Details */}
        <Card>
          <CardHeader>
            <CardTitle>Election Details</CardTitle>
            <CardDescription>Basic information about the election</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Campus President Election 2025"
                {...register('title')}
                disabled={createMutation.isPending}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the election purpose and details..."
                rows={4}
                {...register('description')}
                disabled={createMutation.isPending}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="electionType">Election Type *</Label>
              <Select
                onValueChange={(value) => setValue('electionType', value as any)}
                defaultValue="general"
                disabled={createMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Election</SelectItem>
                  <SelectItem value="local">Local Election</SelectItem>
                  <SelectItem value="organizational">Organizational</SelectItem>
                  <SelectItem value="poll">Poll/Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Date & Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...register('startTime')}
                  disabled={createMutation.isPending}
                />
                {errors.startTime && (
                  <p className="text-sm text-destructive">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Date & Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  {...register('endTime')}
                  disabled={createMutation.isPending}
                />
                {errors.endTime && (
                  <p className="text-sm text-destructive">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
            <CardDescription>Add candidates for this election</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Candidate {index + 1}</h3>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={createMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`candidates.${index}.name`}>Name *</Label>
                  <Input
                    {...register(`candidates.${index}.name`)}
                    placeholder="Candidate name"
                    disabled={createMutation.isPending}
                  />
                  {errors.candidates?.[index]?.name && (
                    <p className="text-sm text-destructive">
                      {errors.candidates[index]?.name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`candidates.${index}.party`}>Party/Affiliation</Label>
                  <Input
                    {...register(`candidates.${index}.party`)}
                    placeholder="Political party or affiliation"
                    disabled={createMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`candidates.${index}.description`}>Description</Label>
                  <Textarea
                    {...register(`candidates.${index}.description`)}
                    placeholder="Brief description or manifesto"
                    rows={3}
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ name: '', description: '', party: '' })}
              disabled={createMutation.isPending}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>

            {errors.candidates && (
              <p className="text-sm text-destructive">{errors.candidates.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/elections')}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Election
          </Button>
        </div>
      </form>
    </div>
  );
};

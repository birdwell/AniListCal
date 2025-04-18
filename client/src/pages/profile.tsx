import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const profileSchema = z.object({
  anilistId: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getUser,
  });

  const updateAnilistId = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("PATCH", `/api/users/${user?.id}`, {
        anilistId: data.anilistId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      toast({
        title: "Profile Updated",
        description: "Your Anilist ID has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      anilistId: user?.id?.toString() || "",
    },
    values: {
      // This will update the form value whenever user data changes
      anilistId: user?.id?.toString() || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      const formData = {
        anilistId: data.anilistId || user?.id?.toString() || "",
      };
      updateAnilistId.mutate(formData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-muted-foreground">{user?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anilist Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold">Profile</h2>
                <p className="text-muted-foreground">{user?.name}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">AniList Connection</h3>
              {user?.id ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    Your AniList account is connected (ID: {user.id})
                  </p>
                  <Button variant="destructive" onClick={() => { }}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    Connect your AniList account to sync your anime list
                  </p>
                  <Button onClick={() => { }}>Connect AniList</Button>
                </div>
              )}
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="anilistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anilist User ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your Anilist user ID"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateAnilistId.isPending}>
                {updateAnilistId.isPending ? "Saving..." : "Save"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react"
import { PlusIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useHouseholdMembers } from "@/features/household/api/hooks"
import { HouseholdMemberList } from "@/features/household/components/HouseholdMemberList"
import { HouseholdMemberDialog } from "@/features/household/components/HouseholdMemberDialog"
import type { HouseholdMember } from "@/features/household/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function HouseholdPage() {
  const { data: members, isLoading, error } = useHouseholdMembers()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<HouseholdMember | undefined>()

  const handleAdd = () => {
    setEditingMember(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (member: HouseholdMember) => {
    setEditingMember(member)
    setDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-10 max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Foyer</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les membres de votre foyer pour un suivi personnalisé.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusIcon className="mr-2 h-4 w-4" weight="bold" />
          Ajouter un membre
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {["sk1", "sk2", "sk3"].map((id) => (
            <Skeleton key={id} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-12 bg-destructive/5 rounded-2xl border border-destructive/20 text-destructive">
          <p>Une erreur est survenue lors du chargement des membres.</p>
        </div>
      )}

      {!isLoading && !error && (
        <HouseholdMemberList members={members || []} onEdit={handleEdit} />
      )}

      <HouseholdMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editingMember}
      />
    </div>
  )
}

import { TrashIcon, PencilIcon, PillIcon, ListIcon, CalendarIcon, DotsThreeVerticalIcon } from "@phosphor-icons/react"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRemoveHouseholdMember } from "../api/hooks"
import { toast } from "sonner"
import type { HouseholdMember } from "../types"
import { useState } from "react"
import { MedicationDialog } from "@/features/medication/components/MedicationDialog"
import { MedicationListDialog } from "@/features/medication/components/MedicationListDialog"
import type { Medication } from "@/features/medication/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

interface HouseholdMemberListProps {
  members: HouseholdMember[]
  onEdit: (member: HouseholdMember) => void
}

export const HouseholdMemberList = ({
  members,
  onEdit,
}: HouseholdMemberListProps) => {
  const navigate = useNavigate()
  const { mutate: removeMember } = useRemoveHouseholdMember()
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<HouseholdMember | null>(null)
  const [editingMedication, setEditingMedication] = useState<Medication | undefined>()

  const handleRemove = (id: string) => {
    if (globalThis.confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
      removeMember(id, {
        onSuccess: () => {
          toast.success("Membre supprimé avec succès")
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Une erreur est survenue")
        },
      })
    }
  }

  const getRelationshipLabel = (relationship: string) => {
    const map: Record<string, string> = {
      self: "Moi-même",
      spouse: "Conjoint(e)",
      child: "Enfant",
      parent: "Parent",
      sibling: "Frère/Sœur",
      other: "Autre",
    }
    return map[relationship] || relationship
  }

  const handleAddMedication = (member: HouseholdMember) => {
    setSelectedMember(member)
    setEditingMedication(undefined)
    setMedicationDialogOpen(true)
  }

  const handleViewMedications = (member: HouseholdMember) => {
    setSelectedMember(member)
    setListDialogOpen(true)
  }

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication)
    setMedicationDialogOpen(true)
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
        <p className="text-muted-foreground">Aucun membre trouvé.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const avatarUrl = member.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${member.firstName}`;
          
          return (
            <Card key={member.id} className="relative mx-auto w-full max-w-sm pt-0 group/member transition-all hover:shadow-xl hover:shadow-primary/5">
              <img
                src={avatarUrl}
                alt={`${member.firstName} ${member.lastName}`}
                className="relative z-20 aspect-video w-full object-cover transition-transform duration-500 group-hover/member:scale-105"
              />
              <CardHeader>
                <CardTitle >{member.firstName} {member.lastName}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">{getRelationshipLabel(member.relationship)}</Badge>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60">
                    Né(e) le  {formatDate(member.dateOfBirth)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-3">
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 hover:bg-primary/5 hover:text-primary transition-colors"
                    onClick={() => handleViewMedications(member)}
                  >
                    <ListIcon className="mr-2 h-4 w-4" />
                    Traitements
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 hover:bg-primary/5 hover:text-primary transition-colors"
                    onClick={() => handleAddMedication(member)}
                  >
                    <PillIcon className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                  
                </div>
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 hover:bg-primary/5 hover:text-primary transition-colors border-primary/20"
                    onClick={() => navigate(`/schedule#${member.id}`)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Planning
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant={'outline'} className="hover:bg-primary/5 hover:text-primary transition-colors">
                        <DotsThreeVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onEdit(member)}>
                       <PencilIcon className="h-4 w-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRemove(member.id)} className="text-red-500">
                        <TrashIcon className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {selectedMember && (
        <>
          <MedicationDialog
            open={medicationDialogOpen}
            onOpenChange={setMedicationDialogOpen}
            medication={editingMedication}
            defaultProfileId={selectedMember.id}
          />
          <MedicationListDialog
            open={listDialogOpen}
            onOpenChange={setListDialogOpen}
            profileId={selectedMember.id}
            profileName={selectedMember.firstName}
            onEdit={handleEditMedication}
          />
        </>
      )}
    </>
  )
}

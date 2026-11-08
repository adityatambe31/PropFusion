import type { Db } from "mongodb";
import { writeAuditLog, type AuditAction, type AuditEntity } from "@/lib/db/audit";
export async function auditMutation(db:Db,input:{userId:string;userEmail?:string;userRole?:string;action:AuditAction;entity:AuditEntity;entityId:string;metadata?:Record<string,unknown>}){
 try { await writeAuditLog(db,{...input,userRole:input.userRole??"manager",metadata:input.metadata??{}}); }
 catch(error){ console.error("Audit logging failed",error); }
}

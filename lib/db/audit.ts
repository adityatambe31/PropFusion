import type { Db } from "mongodb";
export type AuditAction="CREATE"|"UPDATE"|"DELETE"|"UNAUTHORIZED_ACCESS";
export type AuditEntity="asset"|"lease"|"tenant"|"transaction"|"payment";
export type AuditRecord={id:string;userId:string;userEmail?:string;userRole:string;action:AuditAction;entity:AuditEntity;entityId:string;timestamp:string;metadata:Record<string,unknown>;};
export async function writeAuditLog(db:Db,input:Omit<AuditRecord,"id"|"timestamp">){const record={id:crypto.randomUUID(),timestamp:new Date().toISOString(),...input};await db.collection<AuditRecord>("auditLogs").insertOne(record);return record;}

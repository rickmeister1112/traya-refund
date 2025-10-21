#!/usr/bin/env ts-node

import { createConnection } from 'typeorm';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as mysql from 'mysql2/promise';

interface MigrationResult {
  success: boolean;
  message: string;
  error?: string;
}

class MigrationRunner {
  public connection: mysql.Connection | null = null;
  private migrationsRun: string[] = [];

  async connect(): Promise<void> {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'traya_refund',
    };

    this.connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');
  }

  async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await this.connection!.execute(createTableSQL);
    console.log('✅ Migrations table ready');
  }

  async getExecutedMigrations(): Promise<string[]> {
    const [rows] = await this.connection!.execute(
      'SELECT filename FROM migrations ORDER BY id'
    ) as any[];
    
    return rows.map((row: any) => row.filename);
  }

  async getMigrationFiles(): Promise<string[]> {
    const migrationsDir = join(__dirname, '../migrations');
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return files;
  }

  async executeMigration(filename: string): Promise<MigrationResult> {
    try {
      const filePath = join(__dirname, '../migrations', filename);
      const sql = readFileSync(filePath, 'utf8');
      
      // Execute the migration SQL
      await this.connection!.execute(sql);
      
      // Record the migration
      await this.connection!.execute(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );
      
      this.migrationsRun.push(filename);
      return {
        success: true,
        message: `✅ Migration ${filename} executed successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Migration ${filename} failed`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async runMigrations(): Promise<void> {
    try {
      await this.connect();
      await this.createMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }
      
      console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
      pendingMigrations.forEach(file => console.log(`  - ${file}`));
      console.log('');
      
      for (const migration of pendingMigrations) {
        console.log(`🔄 Running migration: ${migration}`);
        const result = await this.executeMigration(migration);
        
        if (result.success) {
          console.log(result.message);
        } else {
          console.error(result.message);
          console.error(`Error: ${result.error}`);
          throw new Error(`Migration ${migration} failed`);
        }
      }
      
      console.log('');
      console.log(`✅ All migrations completed successfully!`);
      console.log(`📊 Executed ${this.migrationsRun.length} migrations`);
      
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      process.exit(1);
    } finally {
      await this.close();
    }
  }

  async rollbackMigration(filename: string): Promise<MigrationResult> {
    try {
      // Remove from migrations table
      await this.connection!.execute(
        'DELETE FROM migrations WHERE filename = ?',
        [filename]
      );
      
      return {
        success: true,
        message: `✅ Migration ${filename} rolled back successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Rollback ${filename} failed`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async showStatus(): Promise<void> {
    try {
      await this.connect();
      await this.createMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      console.log('📊 Migration Status:');
      console.log('');
      
      migrationFiles.forEach(file => {
        const status = executedMigrations.includes(file) ? '✅ Executed' : '⏳ Pending';
        console.log(`  ${status} ${file}`);
      });
      
      console.log('');
      console.log(`Total: ${migrationFiles.length} migrations`);
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(`Pending: ${migrationFiles.length - executedMigrations.length}`);
      
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
    } finally {
      await this.close();
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const runner = new MigrationRunner();
  
  switch (command) {
    case 'run':
    case 'migrate':
      await runner.runMigrations();
      break;
      
    case 'status':
      await runner.showStatus();
      break;
      
    case 'rollback':
      const filename = process.argv[3];
      if (!filename) {
        console.error('❌ Please specify migration filename to rollback');
        process.exit(1);
      }
      await runner.connect();
      await runner.createMigrationsTable();
      const result = await runner.rollbackMigration(filename);
      console.log(result.message);
      await runner.close();
      break;
      
    default:
      console.log('📋 Migration Runner Commands:');
      console.log('');
      console.log('  npm run migration:run     - Run all pending migrations');
      console.log('  npm run migration:status  - Show migration status');
      console.log('  npm run migration:rollback <filename> - Rollback specific migration');
      console.log('');
      console.log('Examples:');
      console.log('  npm run migration:run');
      console.log('  npm run migration:status');
      console.log('  npm run migration:rollback 001_create_customers_table.sql');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { MigrationRunner };

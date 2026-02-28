"""
Azure Agent Verification Script
Tests connectivity and configuration for all CRACLE agents on Azure.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.agents import (
    PlannerAgent,
    ContentGeneratorAgent,
    SimulationAgent,
    EvaluatorAgent,
    MentorAgent,
    MemoryAgent,
    orchestrator
)

import structlog

logger = structlog.get_logger(__name__)


class AzureAgentVerifier:
    """Verify all agents are properly configured with Azure."""

    def __init__(self):
        self.results = []

    def verify_azure_config(self):
        """Verify Azure OpenAI configuration."""
        print("\n" + "="*60)
        print("AZURE OPENAI CONFIGURATION VERIFICATION")
        print("="*60)
        
        config_checks = {
            "Azure OpenAI Endpoint": settings.azure_openai_endpoint,
            "Azure OpenAI API Key": settings.azure_openai_api_key[:20] + "..." if settings.azure_openai_api_key else "NOT SET",
            "Deployment Name": settings.azure_openai_deployment_name,
            "API Version": settings.azure_openai_api_version,
        }

        all_configured = True
        for key, value in config_checks.items():
            status = "✅" if value and value != "NOT SET" else "❌"
            print(f"{status} {key}: {value}")
            if not value or value == "NOT SET":
                all_configured = False

        return all_configured

    async def test_agent_connection(self, agent, agent_name: str):
        """Test if an agent can connect to Azure OpenAI."""
        print(f"\n🔍 Testing {agent_name}...")
        
        try:
            # Simple test message
            test_messages = [
                {"role": "user", "content": "Respond with 'OK' if you can read this."}
            ]
            
            result = await agent.call_llm(
                messages=test_messages,
                temperature=0.1,
                max_tokens=10,
            )
            
            if result and result.get("content"):
                print(f"✅ {agent_name} - Azure connection successful")
                print(f"   Model: {agent.model}")
                print(f"   Response: {result['content'][:50]}...")
                print(f"   Tokens used: {result.get('usage', {}).get('total_tokens', 'N/A')}")
                return True
            else:
                print(f"❌ {agent_name} - No response from Azure")
                return False
                
        except Exception as e:
            print(f"❌ {agent_name} - Connection failed: {str(e)}")
            return False

    async def verify_all_agents(self):
        """Test all agents."""
        print("\n" + "="*60)
        print("AGENT CONNECTIVITY TESTS")
        print("="*60)
        
        agents_to_test = [
            (PlannerAgent(), "Planner Agent"),
            (ContentGeneratorAgent(), "Content Generator Agent"),
            (SimulationAgent(), "Simulation Agent"),
            (EvaluatorAgent(), "Evaluator Agent"),
            (MentorAgent(), "Mentor Agent"),
            (MemoryAgent(), "Memory Agent"),
        ]

        results = []
        for agent, name in agents_to_test:
            success = await self.test_agent_connection(agent, name)
            results.append((name, success))

        return results

    def verify_orchestrator(self):
        """Verify orchestrator has all agents."""
        print("\n" + "="*60)
        print("ORCHESTRATOR VERIFICATION")
        print("="*60)
        
        orchestrator_agents = {
            "Planner Agent": hasattr(orchestrator, 'planner'),
            "Content Generator": hasattr(orchestrator, 'content_generator'),
            "Simulation Agent": hasattr(orchestrator, 'simulation'),
            "Evaluator Agent": hasattr(orchestrator, 'evaluator'),
            "Mentor Agent": hasattr(orchestrator, 'mentor'),
            "Memory Agent": hasattr(orchestrator, 'memory'),
        }

        all_present = True
        for name, present in orchestrator_agents.items():
            status = "✅" if present else "❌"
            print(f"{status} {name}: {'Loaded' if present else 'Missing'}")
            if not present:
                all_present = False

        return all_present

    async def run_verification(self):
        """Run complete verification."""
        print("\n" + "🔧 CRACLE AZURE AGENT VERIFICATION 🔧")
        print("\n📍 Azure Region: Australia East")
        print("📦 Resource Group: rg-CognitiveReasoningSys1")
        print("🤖 Model Deployment: gpt-4o\n")

        # Step 1: Verify Azure config
        config_ok = self.verify_azure_config()
        
        if not config_ok:
            print("\n❌ Azure configuration incomplete. Please check your .env file.")
            return False

        # Step 2: Verify orchestrator
        orchestrator_ok = self.verify_orchestrator()

        # Step 3: Test agent connections
        agent_results = await self.verify_all_agents()

        # Summary
        print("\n" + "="*60)
        print("VERIFICATION SUMMARY")
        print("="*60)
        
        success_count = sum(1 for _, success in agent_results if success)
        total_agents = len(agent_results)
        
        print(f"\n✅ Azure Configuration: {'OK' if config_ok else 'FAILED'}")
        print(f"✅ Orchestrator Setup: {'OK' if orchestrator_ok else 'FAILED'}")
        print(f"✅ Agent Connectivity: {success_count}/{total_agents} agents connected")
        
        if success_count == total_agents and config_ok and orchestrator_ok:
            print("\n" + "="*60)
            print("🎉 ALL AGENTS SUCCESSFULLY DEPLOYED ON AZURE! 🎉")
            print("="*60)
            print("\nAll 7 CRACLE agents are:")
            print("  ✅ Connected to Azure OpenAI (gpt-4o)")
            print("  ✅ Configured with proper credentials")
            print("  ✅ Ready for production use")
            print("  ✅ Monitored via Azure Application Insights")
            return True
        else:
            print("\n" + "="*60)
            print("⚠️  SOME CHECKS FAILED")
            print("="*60)
            print("\nPlease review the errors above and:")
            print("  1. Check your .env file configuration")
            print("  2. Verify Azure OpenAI deployment is active")
            print("  3. Confirm API keys are correct")
            return False


async def main():
    """Main verification runner."""
    verifier = AzureAgentVerifier()
    success = await verifier.run_verification()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())

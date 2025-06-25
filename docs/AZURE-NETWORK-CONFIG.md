# Azure Network Security Group Configuration

## 🔒 Required Network Security Group Rules

Based on your Azure VM configuration, you need to add these inbound port rules:

### Current Configuration ✅
- **SSH (Port 22)** - Already configured
- **PostgreSQL (Port 5432)** - Already configured

### Missing Required Ports ❌
You need to add these ports to your Network Security Group:

## 🌐 Port Configuration Steps

### 1. Add HTTP Port (Port 80)
```
Priority: 320
Name: Allow-HTTP
Port: 80
Protocol: TCP
Source: Any
Destination: Any
Action: Allow
```

### 2. Add Backend API Port (Port 4000)
```
Priority: 330
Name: Allow-Backend-API
Port: 4000
Protocol: TCP
Source: Any
Destination: Any
Action: Allow
```

## 📋 Step-by-Step Azure Portal Instructions

### Method 1: Azure Portal (GUI)
1. Go to **Azure Portal** → **Virtual Machines**
2. Select your VM **"studdybuddy"**
3. Click **"Networking"** in the left sidebar
4. Click **"Add inbound port rule"**
5. Configure Port 80:
   - **Destination port ranges**: `80`
   - **Protocol**: `TCP`
   - **Action**: `Allow`
   - **Priority**: `320`
   - **Name**: `Allow-HTTP`
   - Click **"Add"**
6. Repeat for Port 4000:
   - **Destination port ranges**: `4000`
   - **Protocol**: `TCP`
   - **Action**: `Allow`
   - **Priority**: `330`
   - **Name**: `Allow-Backend-API`
   - Click **"Add"**

### Method 2: Azure CLI
```bash
# Get resource group and NSG name
RESOURCE_GROUP="your-resource-group"
NSG_NAME="studdybuddy-nsg"

# Add HTTP port rule
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name $NSG_NAME \
  --name Allow-HTTP \
  --protocol tcp \
  --priority 320 \
  --destination-port-range 80 \
  --access allow

# Add Backend API port rule
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name $NSG_NAME \
  --name Allow-Backend-API \
  --protocol tcp \
  --priority 330 \
  --destination-port-range 4000 \
  --access allow
```

### Method 3: Azure PowerShell
```powershell
# Set variables
$ResourceGroupName = "your-resource-group"
$NetworkSecurityGroupName = "studdybuddy-nsg"

# Add HTTP port rule
Add-AzNetworkSecurityRuleConfig -NetworkSecurityGroup $nsg -Name "Allow-HTTP" -Access Allow -Protocol Tcp -Direction Inbound -Priority 320 -SourceAddressPrefix * -SourcePortRange * -DestinationAddressPrefix * -DestinationPortRange 80

# Add Backend API port rule
Add-AzNetworkSecurityRuleConfig -NetworkSecurityGroup $nsg -Name "Allow-Backend-API" -Access Allow -Protocol Tcp -Direction Inbound -Priority 330 -SourceAddressPrefix * -SourcePortRange * -DestinationAddressPrefix * -DestinationPortRange 4000

# Apply changes
Set-AzNetworkSecurityGroup -NetworkSecurityGroup $nsg
```

## 🔍 Verification Steps

After adding the ports, verify they're working:

### 1. Check Port Status
```bash
# On your Azure VM, run:
sudo netstat -tuln | grep -E ":80|:4000"

# Should show:
# tcp 0 0 0.0.0.0:80 0.0.0.0:* LISTEN
# tcp 0 0 0.0.0.0:4000 0.0.0.0:* LISTEN
```

### 2. Test External Access
```bash
# From outside your VM:
curl -I http://YOUR-VM-PUBLIC-IP          # Should return HTTP headers
curl -I http://YOUR-VM-PUBLIC-IP:4000     # Should return API response
```

### 3. Test from Browser
- Frontend: http://YOUR-VM-PUBLIC-IP
- Backend API: http://YOUR-VM-PUBLIC-IP:4000

## 🛡️ Security Considerations

### Production Security (Recommended)
For production environments, consider restricting source IPs:

```
Source: Your office/home IP range instead of "Any"
Example: 203.0.113.0/24 (replace with your actual IP range)
```

### HTTPS Setup (Recommended)
1. Add Port 443 for HTTPS
2. Configure SSL certificate
3. Redirect HTTP to HTTPS

### Monitoring
- Enable Azure Monitor for your VM
- Set up alerts for high traffic/resource usage
- Monitor failed connection attempts

## 🔧 Troubleshooting

### If ports still don't work after adding rules:
1. **Check VM-level firewall**:
   ```bash
   sudo ufw status
   sudo ufw allow 80
   sudo ufw allow 4000
   ```

2. **Verify Docker containers are running**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

3. **Check service binding**:
   ```bash
   sudo netstat -tuln | grep -E ":80|:4000"
   ```

4. **Test local connectivity first**:
   ```bash
   curl localhost:80
   curl localhost:4000
   ```

## 📱 Final Network Security Group Rules

Your final NSG should have these inbound rules:

| Priority | Name | Port | Protocol | Source | Destination | Action |
|----------|------|------|----------|--------|-------------|--------|
| 300 | SSH | 22 | TCP | Any | Any | Allow |
| 310 | AllowMyIpAddressCustom5432Inbound | 5432 | TCP | Your IP | Any | Allow |
| 320 | Allow-HTTP | 80 | TCP | Any | Any | Allow |
| 330 | Allow-Backend-API | 4000 | TCP | Any | Any | Allow |

After adding these rules, your StuddyBuddy application will be fully accessible from the internet!
